

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import * as XLSX from 'xlsx';

// Refs para datos reactivos
const artistName = ref('');
const albumTitle = ref('');
const albumUrl = ref('');
const resultadosBusqueda = ref([]);

// Obtiene el token de acceso de Spotify
async function obtenerTokenSpotify() {
  const client_id = '5441ac276fc046da98adf7ffbfdb4924';
  const client_secret = '29a287ad6be04285ac8c589057638228';
  const credentials = btoa(`${client_id}:${client_secret}`);

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error al obtener el token de Spotify:', error);
  }
}

function cargarArchivo(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const contenido = e.target.result;
      procesarYBuscar(contenido);
    };
    reader.readAsText(file);
  }
}

async function procesarYBuscar(contenido) {
  // Divide el contenido en líneas, asegurándose de eliminar espacios en blanco innecesarios
  // y filtrar líneas vacías
  const lineas = contenido.split('\n')
    .map(linea => linea.trim()) // Asegura que se haga trim a cada línea
    .filter(linea => linea !== ''); // Filtra líneas vacías después del trim

  let promesasBusqueda = lineas.map(linea => {
    // Asumiendo que el separador entre el artista y el título del álbum es ' - '
    let [artista, tituloAlbum] = linea.split(' - ').map(parte => parte.trim()); // Hace trim de cada parte

    if (artista && tituloAlbum) {
      return buscarAlbumEnSpotify(artista, tituloAlbum)
        .then(url => {
          return { artista, tituloAlbum, url }; // Asegura que cada parte sea tratada correctamente
        })
        .catch(error => {
          console.error(`Error al buscar: ${artista} - ${tituloAlbum}`, error);
          return { artista, tituloAlbum, url: 'Error al realizar la búsqueda' };
        });
    } else {
      // En caso de que alguna línea no cumpla con el formato esperado después del trim
      console.warn(`Línea no válida o con formato incorrecto: "${linea}"`);
      return Promise.resolve(null); // Retorna null para estas líneas y las filtrará después
    }
  });

  console.log(promesasBusqueda);

  // Espera a que todas las búsquedas se completen, filtra los nulos, y luego ordena


  // Ordena los resultados alfabéticamente por artista o título del álbum
  resultados.sort((a, b) => a.artista.localeCompare(b.artista));

  // Actualiza el estado/reactivo de Vue con los resultados ordenados
  resultadosBusqueda.value = resultados;
}

function ordenarAlfabeticamente(){
  resultadosBusqueda.value.sort((a, b) => a.artista.localeCompare(b.artista));
}


// Busca el álbum en Spotify por nombre de artista y título de álbum
async function buscarAlbumEnSpotify(artista, tituloAlbum) {
  console.log("spotify", artista, tituloAlbum)
  const token = await obtenerTokenSpotify();
  if (!token) {
    console.error('No se pudo obtener el token de Spotify');
    return;
  }

  try {
    const query = encodeURIComponent(`album:${tituloAlbum} artist:${artista}`);
    const response = await axios.get(`https://api.spotify.com/v1/search?q=${query}&type=album&limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.data.albums.items.length > 0) {
      const album = response.data.albums.items[0];
      console.log(album)
      resultadosBusqueda.value.push({
        artista: artista,
        tituloAlbum: tituloAlbum,
        url: album.external_urls.spotify,
      });
    } else {
      resultadosBusqueda.value.push({
        artista: artista,
        tituloAlbum: tituloAlbum,
        url: 'No se encontró el álbum',
      });
    }
  } catch (error) {
    console.error('Error al buscar el álbum en Spotify:', error);
    resultadosBusqueda.value.push({
      artista: artista,
      tituloAlbum: tituloAlbum,
      url: 'Error al realizar la búsqueda',
    });
  }
}

function exportarAExcel() {
  // Asegúrate de que la ordenación no introduzca duplicados. Si es necesario, crea una copia de los datos.
  const resultadosOrdenados = [...resultadosBusqueda.value].sort((a, b) => {
    // Compara por artista y luego por título de álbum, si es necesario
    const comparacionArtista = a.artista.localeCompare(b.artista);
    return comparacionArtista !== 0 ? comparacionArtista : a.tituloAlbum.localeCompare(b.tituloAlbum);
  });

  // Continúa con la creación del libro de Excel como antes, usando resultadosOrdenados
  const wb = XLSX.utils.book_new();
  const wsData = resultadosOrdenados.map(({ artista, tituloAlbum, url }) => [`${artista} - ${tituloAlbum}`, url]);
  wsData.unshift(['Artista - Disco', 'Enlace']); // Encabezados de columna
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
  XLSX.writeFile(wb, 'resultados.xlsx');
}

</script>

<template>
  <div class="container">
    <div class="file-upload">
      <input type="file" @change="cargarArchivo" />
    </div>

    <div class="results" v-if="resultadosBusqueda.length > 0">
      <table>
        <thead>
          <tr>
            <th>Artista - Álbum</th>
            <th>Enlace</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="resultado in resultadosBusqueda" :key="resultado.url">
            <td>{{ resultado.artista }} - {{ resultado.tituloAlbum }}</td>
            <td><a :href="resultado.url" target="_blank">{{ resultado.url }}</a></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>No hay resultados para mostrar.</p>
    </div>

    <div class="export-button" v-if="resultadosBusqueda.length > 0">
      <button @click="exportarAExcel">Exportar a Excel</button>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 20px; /* Espacio entre los elementos */
}

.file-upload {
  /* Estilos para la sección de carga de archivos */
}

.results {
  margin-top: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

.export-button {
  margin-top: 20px;
}
</style>
