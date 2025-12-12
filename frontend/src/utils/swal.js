// Integramos SweetAlert 2 con React

// Creamos una versión personalizada de SweetAlert que entiende y puede renderizar código de React (JSX) dentro de las ventanas emergentes

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Exportamos MySwal para ser utilizado en otros archivos
const MySwal = withReactContent(Swal);
export default MySwal;
