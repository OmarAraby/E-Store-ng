import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Signup } from './components/signup/signup';
import { Home } from './components/home/home';
import { authGuard } from './core/guards/auth.guard';
import { initialRouteResolver } from './core/resolvers/initial-route.resolver';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    component: Login,
    resolve: { initialRoute: initialRouteResolver }
  },
  { 
    path: 'signup', 
    component: Signup,
    canActivate: [authGuard]
  },
  { 
    path: 'home', 
    component: Home, 
    canActivate: [authGuard] 
  },
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];