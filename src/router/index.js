import { createRouter, createWebHistory } from 'vue-router';
import BuscadorEnlacesComponent from '../components/BuscadorEnlaces.vue';
import LimpiarListadoComponent from '../components/LimpiarListado.vue';

const routes = [
  {
    path: '/enlaces-spotify/',
    name: 'Buscador',
    component: BuscadorEnlacesComponent,
  },
  {
    path: '/enlaces-spotify/limpiador',
    name: 'LimpiarListado',
    component: LimpiarListadoComponent,
  },
];

const router = createRouter({
    history: createWebHistory('/'),
    routes,
});

export default router;
