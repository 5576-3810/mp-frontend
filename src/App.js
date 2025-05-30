import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function App() {
  const [fiscales, setFiscales] = useState([]);
  const [casos, setCasos] = useState([]);

  const [formFiscal, setFormFiscal] = useState({
    nombre: '',
    correo: '',
    id_fiscalia: 1
  });

  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState('');
  const [id_fiscal, setIdFiscal] = useState('');

  const [reasignacion, setReasignacion] = useState({
    id_caso: '',
    id_nuevo_fiscal: ''
  });

  const [estadisticas, setEstadisticas] = useState([]);
  const [filtroFiscal, setFiltroFiscal] = useState('');
const [busquedaDescripcion, setBusquedaDescripcion] = useState('');


const fetchEstadisticas = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/estadisticas');
    setEstadisticas(res.data);
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
  }
};

  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchFiscales();
    fetchCasos();
    fetchEstadisticas();
    fetchLogs();
  }, []);

  const fetchFiscales = async () => {
    const res = await axios.get('http://localhost:3000/api/fiscales');
    setFiscales(res.data);
  };

  const fetchCasos = async () => {
    const res = await axios.get('http://localhost:3000/api/casos');
    setCasos(res.data);
  };

  const handleSubmitFiscal = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/fiscales', formFiscal);
      setFormFiscal({ nombre: '', correo: '', id_fiscalia: 1 });
      fetchFiscales();
    } catch (err) {
      alert('Error al agregar fiscal');
    }
  };

  const handleSubmitCaso = async (e) => {
    e.preventDefault();

    if (!['Pendiente', 'Cerrado'].includes(estado)) {
      alert('Estado no permitido. Solo se permite "Pendiente" o "Cerrado".');
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/casos', {
        descripcion,
        estado,
        id_fiscal: Number(id_fiscal)
      });

      alert('Caso creado exitosamente');
      setDescripcion('');
      setEstado('');
      setIdFiscal('');
      fetchCasos();
    } catch (err) {
      console.error('Error al crear caso:', err);
      if (err.response?.status === 500) {
        alert('Error al crear el caso. Verifica que los datos sean válidos.');
      } else {
        alert('Error inesperado al crear caso.');
      }
    }
  };

  const handleReasignar = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/casos/reasignar', {
        id_caso: Number(reasignacion.id_caso),
        id_nuevo_fiscal: Number(reasignacion.id_nuevo_fiscal)
      });

      alert(res.data || 'Reasignación completada');
      setReasignacion({ id_caso: '', id_nuevo_fiscal: '' });
      fetchCasos();
    } catch (err) {
      if (err.response?.status === 400) {
        alert(err.response.data); // Mensaje específico del backend
      } else {
        alert('Error al reasignar caso');
      }
    }
  };

  const fetchLogs = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/logs');
    setLogs(res.data);
  } catch (err) {
    console.error('Error al obtener logs:', err);
  }
};

const casosFiltrados = casos.filter((c) => {
  const coincideFiscal = filtroFiscal ? c.id_fiscal === Number(filtroFiscal) : true;
  const coincideDescripcion = c.descripcion.toLowerCase().includes(busquedaDescripcion.toLowerCase());
  return coincideFiscal && coincideDescripcion;
});





const exportarPDF = () => {
  const doc = new jsPDF();

  const columnas = ['ID', 'Descripción', 'Estado', 'ID Fiscal'];
  const filas = casos.map(c => [
    c.id_caso,
    c.descripcion,
    c.estado,
    c.id_fiscal
  ]);

  autoTable(doc, {
    head: [columnas],
    body: filas
  });

  doc.save('casos.pdf');
};




  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h2>Fiscales</h2>
      <ul>
        {fiscales.map((f) => (
          <li key={f.id_fiscal}>
            {f.nombre} ({f.correo}) — Fiscalía #{f.id_fiscalia}
          </li>
        ))}
      </ul>

      <h3>Agregar Fiscal</h3>
      <form onSubmit={handleSubmitFiscal}>
        <input
          placeholder="Nombre"
          value={formFiscal.nombre}
          onChange={(e) => setFormFiscal({ ...formFiscal, nombre: e.target.value })}
        />
        <input
          placeholder="Correo"
          value={formFiscal.correo}
          onChange={(e) => setFormFiscal({ ...formFiscal, correo: e.target.value })}
        />
        <input
          type="number"
          placeholder="ID Fiscalía"
          value={formFiscal.id_fiscalia}
          onChange={(e) => setFormFiscal({ ...formFiscal, id_fiscalia: Number(e.target.value) })}
        />
        <button type="submit">Agregar Fiscal</button>
      </form>

      <hr />

<h2>Casos</h2>

<button onClick={exportarPDF}>Exportar Casos a PDF</button>

<ul>
  {casos.map((c) => (
    <li key={c.id_caso}>
      #{c.id_caso} - {c.descripcion} — Estado: {c.estado} — Fiscal: {c.id_fiscal}
    </li>
  ))}
</ul>


      <h3>Registrar nuevo caso</h3>
      <form onSubmit={handleSubmitCaso}>
        <input
          type="text"
          placeholder="Descripción del caso"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
        />

        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          required
        >
          <option value="">Seleccionar estado</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Cerrado">Cerrado</option>
        </select>

        <select
          value={id_fiscal}
          onChange={(e) => setIdFiscal(e.target.value)}
          required
        >
          <option value="">Seleccionar fiscal</option>
          {fiscales.map((f) => (
            <option key={f.id_fiscal} value={f.id_fiscal}>
              {f.nombre} (Fiscalía #{f.id_fiscalia})
            </option>
          ))}
        </select>

        <button type="submit">Registrar Caso</button>
      </form>

      <hr />

      <h3>Reasignar Caso</h3>
      <form onSubmit={handleReasignar}>
        <select
          value={reasignacion.id_caso}
          onChange={(e) => setReasignacion({ ...reasignacion, id_caso: e.target.value })}
          required
        >
          <option value="">Seleccionar caso</option>
          {casos.map((c) => (
            <option key={c.id_caso} value={c.id_caso}>
              #{c.id_caso} - {c.descripcion}
            </option>
          ))}
        </select>

        <select
          value={reasignacion.id_nuevo_fiscal}
          onChange={(e) => setReasignacion({ ...reasignacion, id_nuevo_fiscal: e.target.value })}
          required
        >
          <option value="">Seleccionar nuevo fiscal</option>
          {fiscales.map((f) => (
            <option key={f.id_fiscal} value={f.id_fiscal}>
              {f.nombre} (Fiscalía #{f.id_fiscalia})
            </option>
          ))}
        </select>

        <button type="submit">Reasignar Caso</button>
      </form>



<hr />
<h2>Historial de Reasignaciones</h2>
<table border="1" cellPadding={5}>
  <thead>
    <tr>
      <th>ID</th>
      <th>Caso</th>
      <th>Fiscal anterior</th>
      <th>Fiscal nuevo</th>
      <th>Motivo</th>
      <th>Fecha</th>
    </tr>
  </thead>
  <tbody>
    {logs.map(log => (
      <tr key={log.id_log}>
        <td>{log.id_log}</td>
        <td>{log.caso_descripcion}</td>
        <td>{log.fiscal_anterior}</td>
        <td>{log.fiscal_nuevo}</td>
        <td>{log.motivo}</td>
        <td>{log.fecha}</td>
      </tr>
    ))}
  </tbody>
</table>

<h2>Estadísticas por Fiscal</h2>
<table border="1" cellPadding={5}>
  <thead>
    <tr>
      <th>Fiscal</th>
      <th>Total Casos</th>
      <th>Pendientes</th>
      <th>En Proceso</th>
      <th>Cerrados</th>
    </tr>
  </thead>
  <tbody>
    {estadisticas.map((f) => (
      <tr key={f.id_fiscal}>
        <td>{f.nombre}</td>
        <td>{f.total_casos}</td>
        <td>{f.pendientes}</td>
        <td>{f.en_proceso}</td>
        <td>{f.cerrados}</td>
      </tr>
    ))}
  </tbody>
</table>


<h3>Filtrar Casos</h3>
<select
  value={filtroFiscal}
  onChange={(e) => setFiltroFiscal(e.target.value)}
>
  <option value="">Todos los fiscales</option>
  {fiscales.map((f) => (
    <option key={f.id_fiscal} value={f.id_fiscal}>
      {f.nombre}
    </option>
  ))}
</select>

<input
  type="text"
  placeholder="Buscar por descripción"
  value={busquedaDescripcion}
  onChange={(e) => setBusquedaDescripcion(e.target.value)}
/>


<ul>
  {casosFiltrados.map((c) => (
    <li key={c.id_caso}>
      #{c.id_caso} - {c.descripcion} — Estado: {c.estado} — Fiscal: {c.id_fiscal}
    </li>
  ))}
</ul>


    </div>
  );
}

export default App;
