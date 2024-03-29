import { createRouter, createWebHistory } from 'vue-router';
import BuscadorEnlacesComponent from '../components/BuscadorEnlaces.vue';
import LimpiarListadoComponent from '../components/LimpiarListado.vue';

const routes = [
  {
    path: '/',
    name: 'Buscador',
    component: BuscadorEnlacesComponent,
  },
  {
    path: '/limpiador',
    name: 'LimpiarListado',
    component: LimpiarListadoComponent,
  },
];

const router = createRouter({
    history: createWebHistory('/'),
    base: process.env.NODE_ENV === 'production' ? '/enlaces-spotify/' : '/',
    routes,
});

export default router;
