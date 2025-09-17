export interface ProductDto {
    id: string;
    category: string;
    productCode: string;
    name: string;
    price: number;
    minimumQuantity: number;
    discountRate: number;
    createdAt: string;
    images: ProductImageDto[];
  }
  
  export interface ProductImageDto {
    id: string;
    imagePath: string;
    fileName?: string;
    uploadedAt: string;
  }

  