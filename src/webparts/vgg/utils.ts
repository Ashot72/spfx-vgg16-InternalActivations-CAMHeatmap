const tf: any = require('tf')

export const deprocessImage = img =>
  tf.tidy(() => {
    const { mean, variance } = tf.moments(img)
    img = img.sub(mean)
    img = img.div(tf.sqrt(variance).add(tf.backend().epsilon()))

    img = img.add(0.5)
    img = tf.clipByValue(img, 0, 1)
    img = img.mul(255)
    return tf.clipByValue(img, 0, 255).asType('int32')
  })

export const stringChop = (str, size) => {
  if (str == null) return []
  str = String(str)
  size = ~~size
  return size > 0 ? str.match(new RegExp('.{1,' + size + '}', 'g')) : [str]
}
