This is a TensorFlow.js SharePoint WebPart (SPFx) based on VGG16 Convolutional Network.

Internal Activations - I visualize the outputs of intermediate layers (intimidate activations) of a convent which is useful for understanding how successive convent layers transform their inputs and for getting a first idea of the visual features learned by individual convent filters.

CAM-heatmap - I visualize heatmaps of class activation in an input image which helps understanding which parts of an input play the most important role in causing the convent to generate the final classification result.

I converted the VGG16 model from Python into Tensorflow.js format which is available in my [VGG16 Tensorflow.js pretrained model](https://github.com/Ashot72/vgg16-tensorflowjs-model/) GitHub page.

To get started.

```
       Clone the repository

       git clone https://github.com/Ashot72/spfx-vgg16-InternalActivations-CAMHeatmap
       cd spfx-vgg16-InternalActivations-CAMHeatmap

       # installs dependencies
       npm install

       # creates release package which should be deployed in SharePoint app catalog
       npm run deploy-prod
```

Go to [SPFx Internal Activations and CAM Heatmap Video](https://youtu.be/aVQ0-G6-Peo) page

Go to [SPFx Internal Activations and CAM Heatmap description](https://github.com/Ashot72/spfx-vgg16-InternalActivations-CAMHeatmap) page
