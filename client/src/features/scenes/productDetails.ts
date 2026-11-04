import { concentrationLabels, type Product } from '../../types/product'

/** "100 ml · Eau de parfum". */
export function productDetails(product: Product) {
  return [
    product.sizeMl && `${product.sizeMl} ml`,
    product.concentration && concentrationLabels[product.concentration],
  ]
    .filter(Boolean)
    .join(' · ')
}
