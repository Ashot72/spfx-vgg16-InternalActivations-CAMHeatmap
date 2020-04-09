const tf: any = require("tf");
import * as React from 'react';
import { sp } from '@pnp/sp'
import { Placeholder } from "@pnp/spfx-controls-react/lib/Placeholder";
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { ImagePicker } from 'react-file-picker'
import { Dialog } from '@microsoft/sp-dialog';
import * as strings from 'VggWebPartStrings'
import styles from './Vgg.module.scss';
import { IMAGENET_CLASSES } from '../../imagenet_classes'
import { gradClassActivationMap } from '../../cam'
import { IVggProps } from './IVggProps';
import { IVggState } from './IVggState';
import ListService from '../../services/list-service'
import VggModal from '../Vgg-Modal/Vgg-Modal';
import { getInternalActivations } from '../../filters'

export default class Vgg extends React.Component<IVggProps, IVggState> {

  public state = {
    base64: null,
    imgData: false,
    top3: [],
    message: null,
    predicted: false,
    showModal: false,
  };

  private blocksTitle = 'vgg_blocks'
  private camTitle = 'vgg_cam'
  private whichTitle;

  private model;
  private output
  private img

  public render(): React.ReactElement<IVggProps> {
    const { base64, top3, message, predicted, showModal } = this.state
    const { needsConfiguration, onConfigure, blocks, cam } = this.props

    return (
      <div>
        {
          needsConfiguration &&
          <div>
            <Placeholder
              iconName='Edit'
              iconText={strings.IconText}
              description={strings.Description}
              buttonLabel={strings.ButtonLabel}
              onConfigure={onConfigure}
            />
          </div>}
        {
          !needsConfiguration &&
          <div className={styles.container}>
            <div style={{ display: 'flex' }}>
              <div style={{ padding: '2px' }}>
                <ImagePicker
                  dims={{ minWidth: 10, maxWidth: 1200, minHeight: 10, maxHeight: 1200 }}
                  extensions={['jpg', 'jpeg', 'png']}
                  onChange={data => this.setState({ base64: data, predicted: false, top3: [] })}
                  onError={errMsg => Dialog.alert(errMsg)}
                >
                  <PrimaryButton text={strings.SelectImage} />
                </ImagePicker >
              </div>
              {
                (!message && base64) &&
                <div className={styles.btn}>
                  <PrimaryButton text={strings.Predict} onClick={this.predict} />
                </div>
              }

              {predicted && blocks && blocks.length > 0 &&
                <div className={styles.btn}>
                  <PrimaryButton text={strings.GenInternalActivations} onClick={this.genInternalActivations} />
                </div>
              }
              {
                blocks && blocks.length > 0 &&
                <div className={styles.btn}>
                  <PrimaryButton text={strings.ViewInternalActivations} onClick={() => this.view(this.blocksTitle)} />
                </div>
              }
              {
                predicted && cam &&
                <div className={styles.btn}>
                  <PrimaryButton text={strings.GenCAMHeatmap} onClick={this.genCAM} />
                </div>
              }
              {
                cam &&
                <div className={styles.btn}>
                  <PrimaryButton text={strings.ViewCAMHeatmap} onClick={() => this.view(this.camTitle)} />
                </div>
              }
              <div>
              </div>
            </div>
            {
              base64 &&
              <img ref="img" src={base64} />
            }
            <div className={styles.centered}>
              <div><b style={{ color: 'red' }}>{message}</b></div>
              {
                top3.length > 0 &&
                <ul className={styles.list}>
                  {
                    top3.map((result, i) =>
                      <li key={result.className}>
                        {
                          i === 0
                            ? <b>{this.result(result)}</b>
                            : this.result(result)
                        }
                      </li>
                    )}
                </ul>
              }
            </div>
          </div>
        }
        <div>
          {showModal &&
            <VggModal
              title={this.whichTitle}
              width={this.isBlocksTitle() ? '1024px' : '245px'}
              field={this.isBlocksTitle() ? 'Block' : 'CAM'}
              header={this.isBlocksTitle() ? strings.InternalActivations : strings.CAMHeatmap}
              onDismiss={() => this.setState({ showModal: false })}
            />
          }
        </div>
      </div >
    );
  }

  private isBlocksTitle = () => this.whichTitle === this.blocksTitle

  private view = (title: string) => {
    this.whichTitle = title
    this.setState({ showModal: true })
  }

  private result = ({ className, probability }): JSX.Element =>
    <span>{className} - ({probability.toFixed(4)})</span>

  private loadModel = async () =>
    !this.model ? this.model = await tf.loadLayersModel(this.props.serviceUrl) : this.model

  private predictResult = (prediction) => {
    const top3 = (Array as any).from(prediction)
      .map((p, i) => ({
        probability: p,
        className: IMAGENET_CLASSES[i]
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3)

    this.setState({ top3, message: null, predicted: true })
  }

  private predict = async () => {
    try {
      this.setState({ message: strings.LoadingModelStatus, predicted: false, top3: [] })
      await this.loadModel()
    } catch (e) {
      this.showError(e);
      return
    }

    const img = tf.browser.fromPixels(this.refs.img).asType('float32')
    this.img = tf.image.resizeBilinear(img, [224, 224]).expandDims();

    this.setState({ message: strings.PredictingStatus })
    try {
      setTimeout(async () => {
        this.output = this.model.predict(this.img)
        const prediction = await this.output.data()
        this.predictResult(prediction)
      }, 0)
    } catch (e) { this.showError(e) }

  }

  private writeInternalActivation = async (): Promise<void> => {
    const { blocks, numFilters } = this.props

    return getInternalActivations(this.model, this.img, blocks, numFilters)
      .then(imageData => ListService
        .addBlocks(this.blocksTitle, blocks, numFilters, imageData))
      .catch(this.showError)
  }

  private genInternalActivations = () => {
    this.setState({ message: strings.GenInternalActivationsStatus }, () => {
      const createList = (): Promise<any> =>
        ListService.createList(this.blocksTitle, 'Block')
          .then(() => this.writeInternalActivation())
          .then(() => this.setState({ message: null }))
          .catch(this.showError)

      sp.web.lists.getByTitle(this.blocksTitle).items.get()
        .then(() => ListService.deleteList(this.blocksTitle))
        .then(() => createList())
        .catch(e => (e.status === 404) ? createList() : this.showError)
    })
  }

  private genCAM = () => {
    this.setState({ message: strings.GenCAMHeatmapStatus })

    setTimeout(async () => {
      const { indices: topKIndices } = tf.topk(this.output, 1)
      const indices = (Array as any).from(await topKIndices.data())

      gradClassActivationMap(this.model, indices, this.img)
        .then((camData: string) => {
          const createList = (): Promise<any> =>
            ListService.createList(this.camTitle, 'CAM')
              .then(() => ListService.addCAM(this.camTitle, camData))
              .then(() => this.setState({ message: null }))
              .catch(this.showError)

          sp.web.lists.getByTitle(this.camTitle).items.get()
            .then(() => ListService.deleteList(this.camTitle))
            .then(() => createList())
            .catch(e => (e.status === 404) ? createList() : this.showError)
        })
        .catch(this.showError)
    }, 0)

  }

  private showError = e => {
    this.setState({ message: null })
    Dialog.alert(e.message)
  }
}
