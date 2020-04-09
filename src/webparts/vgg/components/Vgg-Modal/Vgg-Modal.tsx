const tf: any = require("tf")
import * as React from 'react';
import { Icon, Modal } from 'office-ui-fabric-react/lib';
import { Dialog } from '@microsoft/sp-dialog';
import styles from './Vgg-Modal.module.scss';
import IVGGModalProps from './IVgg-ModalProps';
import IVGGModalState from './IVgg-ModalState';
import ListService from '../../services/list-service';
import Spinner from '../Spinner/Spinner'

export default class VggModal extends React.Component<IVGGModalProps, IVGGModalState> {
    public state = {
        imgTensors: [],
        loading: false
    }

    public componentDidMount() {
        const { title, field } = this.props
        this.setState({ loading: true })

        ListService.getData(title, field)
            .then(blocks => {
                this.setState({
                    imgTensors: field === 'CAM'
                        ? this.getCam(blocks)
                        : this.getInternalActivations(blocks), loading: false
                })
                this.renderImages()
            })
            .catch(e => {
                this.setState({ loading: false })
                this.closeModal()
                setTimeout(() => Dialog.alert(e.message), 0)
            });
    }

    private getInternalActivations = blocks => {
        let tmpBlock
        const result = []

        const pushTempBlock = () => {
            if (tmpBlock) {
                result.push(tmpBlock)
                tmpBlock = null
            }
        }

        blocks.forEach((block) => {
            const { Title, Block } = block
            const index = Title.indexOf('chunk')

            if (index === -1) {
                pushTempBlock()
                result.push(block)
            } else {
                const title = Title.substring(0, index - 1)
                if (tmpBlock) {
                    if (title === tmpBlock.Title) {
                        tmpBlock = { Title: title, Block: tmpBlock.Block + Block }
                    } else {
                        result.push(tmpBlock)
                        tmpBlock = { Title: title, Block: Block }
                    }
                } else {
                    tmpBlock = { Title: title, Block: Block }
                }
            }
        })
        pushTempBlock()

        return result.map(({ Title, Block }) => {
            const { data, shape } = JSON.parse(Block)
            return { title: Title, block: tf.tensor(new Float32Array(data), shape) }
        })
    }

    private getCam = blocks => {
        const block = blocks.map(b => b.CAM).join('')
        const { data, shape } = JSON.parse(block)
        return [{
            title: this.props.header,
            block: tf.tensor(new Float32Array(data), shape)
                .expandDims()
        }]
    }

    public render(): React.ReactElement<IVGGModalProps> {
        const { header, width } = this.props

        return (
            <Modal
                isOpen={true}
                isBlocking={true}
                onDismiss={this.closeModal}
            > <div>
                    <div className={styles.header}>
                        <span>{header}</span>
                        <div className={styles.close} onClick={this.closeModal}>
                            <Icon iconName="ChromeClose" style={{ cursor: 'pointer' }} /></div>
                    </div>
                    <div className={styles.modalBody} style={{ width }}>
                        {this.state.loading && <Spinner />}
                        {this.renderCanvases()}
                    </div>
                </div>
            </Modal >
        )
    }

    private renderCanvases = () =>
        <div className={styles.flexContainer}>
            {this.state.imgTensors.map(({ title, block: { shape } }, i) =>
                <div>
                    <canvas ref={'cnv' + i} width={shape[1]} height={shape[2]}></canvas><br />
                    <b>{`${title}`}</b><br />{`${shape[1]} x ${shape[2]}`}
                </div>
            )}
        </div>

    private renderImages = () =>
        this.state.imgTensors.map(({ block }, i) =>
            tf.browser.toPixels(tf.squeeze(block), this.refs['cnv' + i])
        )

    private closeModal = (): void => this.props.onDismiss();
}