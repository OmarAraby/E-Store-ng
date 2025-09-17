import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { ProductService } from '../../core/services/product.service';
import { User } from '../../core/models/auth.models';
import { ProductDto } from '../../core/models/product.models';
import { environment } from '../../../environments/environment';

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
  products = signal<ProductDto[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 12;

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

    this.productService.getAllProducts().subscribe({
      next: (products) => {
        // Transform products to ensure full image URLs
        const processedProducts = products.map(product => ({
          ...product,
          images: product.images.map(image => ({
            ...image,
            imagePath: this.getProductImageUrl(image.imagePath)
          }))
        }));

        this.products.set(processedProducts);
        this.isLoading.set(false);
        
        // Reset to first page when products are loaded
        this.currentPage = 1;
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
    return Math.ceil(this.products().length / this.itemsPerPage);
  }

  getPaginatedProducts(): ProductDto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.products().slice(startIndex, endIndex);
  }

  goToPage(page: number | string) {
    if (typeof page === 'number' && page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      // Scroll to top of products section
      this.scrollToProducts();
    }
  }

  getPageNumbers(): (number | string)[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.currentPage;
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
    this.currentPage = 1; // Reset to first page
    this.scrollToProducts();
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  getEndIndex(): number {
    const endIndex = this.currentPage * this.itemsPerPage;
    return Math.min(endIndex, this.products().length);
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