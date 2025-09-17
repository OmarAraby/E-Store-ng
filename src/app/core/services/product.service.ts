import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ProductDto, ProductImageDto } from '../models/product.models';
import { ApiResponse } from '../models/api-response.models';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  constructor() {}

  // Get all products
  getAllProducts(): Observable<ProductDto[]> {
    return this.http.get<ApiResponse<ProductDto[]>>(`${this.apiUrl}/product`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch products');
      }),
      catchError(this.handleError)
    );
  }

  // Get product by ID
  getProductById(id: string): Observable<ProductDto> {
    return this.http.get<ApiResponse<ProductDto>>(`${this.apiUrl}/products/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Product not found');
      }),
      catchError(this.handleError)
    );
  }

  // Get product by product code
  getProductByCode(productCode: string): Observable<ProductDto> {
    return this.http.get<ApiResponse<ProductDto>>(`${this.apiUrl}/products/code/${productCode}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Product not found');
      }),
      catchError(this.handleError)
    );
  }

  // Get products by category
  getProductsByCategory(category: string): Observable<ProductDto[]> {
    return this.http.get<ApiResponse<ProductDto[]>>(`${this.apiUrl}/products/category/${category}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch products');
      }),
      catchError(this.handleError)
    );
  }

  // Create a new product
  createProduct(productData: any): Observable<ProductDto> {
    return this.http.post<ApiResponse<ProductDto>>(`${this.apiUrl}/products`, productData).pipe(
      map(response => {
        if (response.success && response.data) {
          this.notificationService.showSuccess('Product created successfully');
          return response.data;
        }
        throw new Error(response.message || 'Failed to create product');
      }),
      catchError(this.handleError)
    );
  }

  // Update an existing product
  updateProduct(id: string, productData: any): Observable<ProductDto> {
    return this.http.put<ApiResponse<ProductDto>>(`${this.apiUrl}/products/${id}`, productData).pipe(
      map(response => {
        if (response.success && response.data) {
          this.notificationService.showSuccess('Product updated successfully');
          return response.data;
        }
        throw new Error(response.message || 'Failed to update product');
      }),
      catchError(this.handleError)
    );
  }

  // Delete a product
  deleteProduct(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/products/${id}`).pipe(
      map(response => {
        if (response.success) {
          this.notificationService.showSuccess('Product deleted successfully');
          return true;
        }
        throw new Error(response.message || 'Failed to delete product');
      }),
      catchError(this.handleError)
    );
  }

  // Get product images
  getProductImages(productId: string): Observable<ProductImageDto[]> {
    return this.http.get<ApiResponse<ProductImageDto[]>>(`${this.apiUrl}/products/${productId}/images`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch product images');
      }),
      catchError(this.handleError)
    );
  }

  // Upload product image
  uploadProductImage(productId: string, imageFile: File): Observable<ProductImageDto> {
    const formData = new FormData();
    formData.append('imageFile', imageFile, imageFile.name);

    return this.http.post<ApiResponse<ProductImageDto>>(`${this.apiUrl}/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          this.notificationService.showSuccess('Image uploaded successfully');
          return response.data;
        }
        throw new Error(response.message || 'Failed to upload image');
      }),
      catchError(this.handleError)
    );
  }

  // Delete product image
  deleteProductImage(productId: string, imageId: string): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/products/${productId}/images/${imageId}`).pipe(
      map(response => {
        if (response.success) {
          this.notificationService.showSuccess('Image deleted successfully');
          return true;
        }
        throw new Error(response.message || 'Failed to delete image');
      }),
      catchError(this.handleError)
    );
  }

  // Error handling method
  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }

    this.notificationService.showError(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
