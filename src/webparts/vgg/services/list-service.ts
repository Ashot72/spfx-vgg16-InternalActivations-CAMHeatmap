import { sp } from '@pnp/sp'
import { stringChop } from '../utils'

export default class ListService {
  private static limit = 1030000

  public static createList = (title: string, field: string): Promise<any> =>
    sp.web.lists
      .add(title, title, 100)
      .then(result =>
        result.list.fields.add(field, 'SP.Field', { FieldTypeKind: 3 })
      )

  public static getData = (title: string, field: string): Promise<any> =>
    sp.web.lists
      .getByTitle(title)
      .items.select('Title', field)
      .orderBy('Title', true)
      .top(5000)
      .get()

  public static addBlocks = (
    title: string,
    blocks: string[],
    numFilters: number,
    imageData: string[]
  ): Promise<any> =>
    new Promise((resolve, reject) => {
      let count = 0
      let result = 0

      blocks.forEach((block: string) => {
        for (let i = 0; i < numFilters; i++) {
          const curImgData = imageData[count]
          const chunks = Math.ceil(curImgData.length / ListService.limit)

          if (chunks < 2) {
            sp.web.lists
              .getByTitle(title)
              .items.add({ Title: `${block}_${i}`, Block: curImgData })
              .then(() => {
                result++
                if (result === blocks.length * numFilters) resolve()
              })
              .catch(reject)
          } else {
            const data = stringChop(curImgData, ListService.limit)
            let chunk = 0

            for (let j = 0; j < data.length; j++) {
              sp.web.lists
                .getByTitle(title)
                .items.add({
                  Title: `${block}_${i}_chunk_${j}`,
                  Block: data[j]
                })
                .then(() => {
                  chunk++
                  if (chunk === chunks) {
                    result++
                    if (result === blocks.length * numFilters) resolve()
                  }
                })
                .catch(reject)
            }
          }
          count++
        }
      })
    })

  public static addCAM = (title: string, cam: string): Promise<any> =>
    new Promise((resolve, reject) => {
      const chunks = Math.ceil(cam.length / ListService.limit)

      if (chunks < 2) {
        sp.web.lists.getByTitle(title).items.add({ Title: title, CAM: cam })
      } else {
        const data = stringChop(cam, ListService.limit)
        let chunk = 0

        for (let i = 0; i < data.length; i++) {
          sp.web.lists
            .getByTitle(title)
            .items.add({ Title: title + i, CAM: data[i] })
            .then(() => {
              chunk++
              if (chunk === chunks) resolve()
            })
            .catch(reject)
        }
      }
    })

  public static deleteList = (title: string): Promise<void> =>
    sp.web.lists.getByTitle(title).delete()
}
