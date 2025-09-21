import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { User } from '../../core/models/auth.models';
import { ProductDto, ProductQueryParams } from '../../core/models/product.models';
import { environment } from '../../../environments/environment';
import { PageList } from '../../core/models/common.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  
  user: User | null = null;
  // products = signal<ProductDto[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // // Pagination properties
  // currentPage = 1;
  // itemsPerPage = 12;

  pageList = signal<PageList<ProductDto>|null>(null);

  queryParams:ProductQueryParams={
    pageNumber:1,
    pageSize:6
  }

  
  itemsPerPage: number;
  
  constructor(){
    this.itemsPerPage = this.queryParams.pageSize ?? 6;
  }
  // Method to get full image URL
  getProductImageUrl(imagePath: string): string {
    // If imagePath is already a full URL, return it
    if (imagePath.startsWith('http')) return imagePath;
    
    // Combine static files base URL with image path, removing any leading '/'
    return `${environment.StaticFilesUrl}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading.set(true);
    this.error.set(null);

    this.productService.getPaginatedProducts(this.queryParams).subscribe({
      next: (res) => {
        // Transform products to ensure full image URLs
        const processedProducts = res.items.map(product => ({
          ...product,
          images: product.images.map(image => ({
            ...image,
            imagePath: this.getProductImageUrl(image.imagePath)
          }))
        }));

        this.pageList.set({...res,items:processedProducts});
        this.isLoading.set(false);
        
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load products');
        this.isLoading.set(false);
      }
    });
  }

  logout() {
    this.authService.logout().subscribe();
  }

  // Pagination methods
  getTotalPages(): number {
    return this.pageList()?.totalPages??0;
  }

  // useless for now 

  // getPaginatedProducts(): ProductDto[] {
  //   const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  //   const endIndex = startIndex + this.itemsPerPage;
  //   return this.products().slice(startIndex, endIndex);
  // }

  goToPage(page: number | string) {
    if (typeof page === 'number' && page >= 1 && page <= this.getTotalPages()) {
      this.queryParams.pageNumber = page;
      this.loadProducts();
      // Scroll to top of products section
      this.scrollToProducts();
    }
  }

  getPageNumbers(): (number | string)[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.queryParams.pageNumber!;
    const pageNumbers: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if total pages is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      if (currentPage > 4) {
        pageNumbers.push('...');
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (currentPage < totalPages - 3) {
        pageNumbers.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  }

  onItemsPerPageChange() {
    this.queryParams.pageSize = this.itemsPerPage;
    this.queryParams.pageNumber = 1
    this.loadProducts();
    this.scrollToProducts();
  }

  getStartIndex(): number {
    const pageInfo = this.pageList();
    if (!pageInfo || pageInfo.totalCount === 0) return 0;
    return (pageInfo.pageNumber - 1) * pageInfo.pageSize + 1;
  }

  getEndIndex(): number {
    const pageInfo = this.pageList();
    if (!pageInfo || pageInfo.totalCount === 0) return 0;
    return (pageInfo.pageNumber - 1) * pageInfo.pageSize + pageInfo.items.length;
  }

  private scrollToProducts() {
    // Smooth scroll to products section
    setTimeout(() => {
      const productsSection = document.querySelector('.products-section');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}