import { RGB_COLORMAP } from './color_map'

const tf: any = require('tf')

const applyColorMap = img => {
  return tf.tidy(() => {
    // Get normalized img.
    const EPSILON = 1e-5
    const xRange = img.max().sub(img.min())
    const xNorm = img.sub(img.min()).div(xRange.add(EPSILON))
    const xNormData = xNorm.dataSync()

    const h = img.shape[1]
    const w = img.shape[2]
    const buffer = tf.buffer([1, h, w, 3])

    const colorMapSize = RGB_COLORMAP.length / 3
    for (let i = 0; i < h; ++i) {
      for (let j = 0; j < w; ++j) {
        const pixelValue = xNormData[i * w + j]
        const row = Math.floor(pixelValue * colorMapSize)
        buffer.set(RGB_COLORMAP[3 * row], 0, i, j, 0)
        buffer.set(RGB_COLORMAP[3 * row + 1], 0, i, j, 1)
        buffer.set(RGB_COLORMAP[3 * row + 2], 0, i, j, 2)
      }
    }
    return buffer.toTensor()
  })
}

export const gradClassActivationMap = (
  model,
  classIndex,
  img,
  overfloyFactor = 2.0
) => {
  let layerIndex = model.layers.length - 1
  while (layerIndex >= 0) {
    if (model.layers[layerIndex].getClassName().startsWith('Conv')) {
      break
    }
    layerIndex--
  }

  const lastConvLayer = model.layers[layerIndex]

  const lastConvLayerOutput = lastConvLayer.output
  const subModel1 = tf.model({
    inputs: model.inputs,
    outputs: lastConvLayerOutput
  })

  const newInput = tf.input({ shape: lastConvLayerOutput.shape.slice(1) })
  layerIndex++
  let y = newInput
  while (layerIndex < model.layers.length) {
    y = model.layers[layerIndex++].apply(y)
  }
  const subModel2 = tf.model({ inputs: newInput, outputs: y })

  const heatMapInfo = tf.tidy(() => {
    const convOutput2ClassOutput = input => {
      const sub = subModel2.apply(input, { training: true })
      return sub.gather([classIndex], 1)
    }

    const gradFunction = tf.grad(convOutput2ClassOutput)

    const lastConvLayerOutputValues = subModel1.apply(img)

    const gradValues = gradFunction(lastConvLayerOutputValues)

    const pooledGradValues = tf.mean(gradValues, [0, 1, 2])

    const scaledConvOutputValues = lastConvLayerOutputValues.mul(
      pooledGradValues
    )

    let heatMap = scaledConvOutputValues.mean(-1)

    heatMap = heatMap.relu()
    heatMap = heatMap.div(heatMap.max()).expandDims(-1)

    heatMap = tf.image.resizeBilinear(heatMap, [img.shape[1], img.shape[2]])

    heatMap = applyColorMap(heatMap)

    heatMap = heatMap.mul(overfloyFactor).add(img.div(255))
    return heatMap.div(heatMap.max()).squeeze()
  })

  const heatMapData = async heatMap =>
    JSON.stringify({
      data: (Array as any).from(await heatMap.data()),
      shape: heatMap.shape
    })

  return heatMapData(heatMapInfo)
}
