import { isEqual, uniqWith } from 'lodash-es'

export function deepUnique<T extends any[]>(array: T): T {
  return uniqWith(array, isEqual) as T
}
