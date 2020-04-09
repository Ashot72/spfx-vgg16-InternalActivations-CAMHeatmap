import * as React from 'react'
import * as ReactDom from 'react-dom'
import { sp } from '@pnp/sp'
import { Version } from '@microsoft/sp-core-library'
import { PropertyFieldMultiSelect } from '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect'
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import * as strings from 'VggWebPartStrings'
import Vgg from './components/Vgg/Vgg'
import { IVggProps } from './components/Vgg/IVggProps'

export interface IVggWebPartProps {
  blocks: string[]
  cam: boolean
  serviceUrl: string
  numFilters: number
}

export default class VggWebPart extends BaseClientSideWebPart<
  IVggWebPartProps
> {
  protected onInit (): Promise<void> {
    return super.onInit().then(_ =>
      sp.setup({
        spfxContext: this.context
      })
    )
  }

  public render (): void {
    const { blocks, serviceUrl, cam, numFilters } = this.properties
    const needsConfiguration = !serviceUrl

    const element: React.ReactElement<IVggProps> = React.createElement(Vgg, {
      needsConfiguration,
      serviceUrl,
      blocks,
      cam,
      numFilters,
      onConfigure: (): void => this.context.propertyPane.open()
    })

    ReactDom.render(element, this.domElement)
  }

  protected onDispose (): void {
    ReactDom.unmountComponentAtNode(this.domElement)
  }

  protected get dataVersion (): Version {
    return Version.parse('1.0')
  }

  protected getPropertyPaneConfiguration (): IPropertyPaneConfiguration {
    const { blocks } = this.properties

    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.Settings,
              groupFields: [
                PropertyPaneTextField('serviceUrl', {
                  label: strings.ServiceURL
                }),
                PropertyFieldMultiSelect('blocks', {
                  key: 'blocks',
                  label: strings.VGG16Layers,
                  options: [
                    {
                      key: 'block1_conv1',
                      text: 'block1_conv1'
                    },
                    {
                      key: 'block1_conv2',
                      text: 'block1_conv2'
                    },
                    {
                      key: 'block2_conv1',
                      text: 'block2_conv1'
                    },
                    {
                      key: 'block2_conv2',
                      text: 'block2_conv2'
                    },
                    {
                      key: 'block3_conv1',
                      text: 'block3_conv1'
                    },
                    {
                      key: 'block3_conv2',
                      text: 'block3_conv2'
                    },
                    {
                      key: 'block3_conv3',
                      text: 'block3_conv3'
                    },
                    {
                      key: 'block4_conv1',
                      text: 'block4_conv1'
                    },
                    {
                      key: 'block4_conv2',
                      text: 'block4_conv2'
                    },
                    {
                      key: 'block4_conv3',
                      text: 'block4_conv3'
                    },
                    {
                      key: 'block5_conv1',
                      text: 'block5_conv1'
                    },
                    {
                      key: 'block5_conv2',
                      text: 'block5_conv2'
                    },
                    {
                      key: 'block5_conv3',
                      text: 'block5_conv3'
                    }
                  ],
                  selectedKeys: blocks
                }),
                PropertyPaneTextField('numFilters', {
                  label: strings.NumOfFilters,
                  disabled: !blocks || blocks.length === 0
                }),
                PropertyPaneToggle('cam', {
                  label: strings.GenCAMHeatmap
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
