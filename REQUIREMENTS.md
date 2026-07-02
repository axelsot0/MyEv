# Requerimientos iniciales — App de seguimiento de desempeño para desarrolladores

## 1. Descripción general

App web para registrar, medir y analizar el desempeño de un desarrollador
durante sus sprints de trabajo.

Orientada a desarrolladores que trabajan con Jira y Bitbucket. En la primera
versión el registro es manual: el usuario ingresa incidencias asumidas,
puntos, flujos, ramas, PRs y estados relevantes.

Objetivo principal: comparar lo asumido al inicio del sprint con lo realmente
trabajado, medir cuánto tarda cada incidencia en completarse y visualizar
carga, velocity y experiencia técnica acumulada por módulo.

## 2. Alcance inicial

Primera versión: uso personal del desarrollador.

Diseñar pensando en futura expansión con:

- más desarrolladores
- grupos de trabajo
- supervisores
- filtros por desarrollador
- reportes grupales
- edición de información por parte del supervisor

## 3. Roles

### Desarrollador

- Registrar sus sprints.
- Registrar las incidencias asumidas en el sprint planning.
- Asociar incidencias a módulos técnicos.
- Registrar puntos de historia cuando aplique.
- Registrar ramas de Bitbucket.
- Registrar uno o varios PRs por incidencia.
- Registrar cuándo un PR fue mergeado.
- Ver su dashboard personal.
- Ver alertas sobre ramas o PRs antiguos.
- Generar reportes en PDF.
- Ver su carga por sprint.
- Ver su velocity.
- Ver en qué módulos técnicos ha trabajado más.

### Supervisor

- Ver información de desarrolladores.
- Filtrar por desarrollador.
- Filtrar por grupo.
- Ver métricas individuales y grupales.
- Editar información de los desarrolladores.
- Revisar reportes.
- Analizar avance, carga y desempeño por sprint.

## 4. Sprints

- Duración: 2 semanas.
- Inicia cada 2 miércoles con el sprint planning.
- Registrar la hora real en que termina el sprint planning (varía: 12:00 p.m.,
  1:00 p.m. o 2:00 p.m.).
- Esa hora es la base de medición: el tiempo de trabajo de una incidencia se
  mide desde el final del sprint planning hasta que el PR correspondiente sea
  mergeado.

## 5. Incidencias de Jira

Registradas manualmente.

Tipos:

- Feature
- Bug
- Task

Reglas:

- Solo las Features tienen puntos.
- Bugs y Tasks no tienen puntos.
- Bugs y Tasks se registran porque consumen tiempo real de trabajo.
- Cada incidencia pertenece a un solo desarrollador.
- Una incidencia puede tener más de un PR.
- Una incidencia debe pertenecer a un módulo técnico.

Estados de Jira usados:

- To Do
- InProgress
- Waiting For Dependency
- Progress Done
- Inspection
- Done

Criterio principal de completado: PR mergeado (no el estado Done de Jira).

## 6. Módulos técnicos

Cada incidencia se asocia manualmente a un módulo técnico.

Ejemplos iniciales:

- Login
- Prelogged
- OTP
- Dashboard App
- Dashboard X

Los módulos permiten medir:

- en qué áreas ha trabajado más el desarrollador
- en qué módulos tiene más experiencia
- qué módulos consumen más tiempo
- qué módulos concentran más Features, Bugs o Tasks
- qué módulos han aportado más puntos completados

## 7. Bitbucket, ramas y PRs

Registro manual en la primera versión.

Campos a registrar:

- nombre de rama
- fecha de creación de rama
- fecha de eliminación de rama
- URL o identificador del PR
- fecha de creación del PR
- fecha de merge del PR
- rama origen
- rama destino
- estado del PR

El nombre de la rama siempre contiene el código de la incidencia de Jira.
Ejemplo: `feature/AR-336-contact-search`. Esto relaciona visualmente una rama
con su incidencia.

## 8. Criterio de finalización

Una incidencia se considera completada cuando el PR está mergeado.

No basta con Done en Jira. Para medición de desempeño, el merge del PR es la
fuente principal de cierre.

## 9. Métricas principales

### Carga asumida por sprint

Puntos asumidos en Features al inicio del sprint. También cantidad de Bugs y
Tasks asumidos o trabajados (sin puntos).

### Velocity

Puntos completados en el sprint. Solo cuentan Features con puntos y PR
mergeado.

### Tiempo de ciclo por incidencia

Desde el final del sprint planning hasta el merge del PR.

### Tiempo de PR abierto

Desde la creación del PR hasta su merge.

### Tiempo de rama activa

Desde la creación de la rama hasta su eliminación.

### Trabajo por módulo técnico

Cantidad de incidencias, puntos y tiempo invertido por módulo.

### Asumido vs trabajado

Comparación entre incidencias comprometidas al inicio del sprint e incidencias
realmente trabajadas durante el sprint.

## 10. Dashboard principal

### Dashboard del desarrollador

- sprint actual
- puntos asumidos
- puntos completados
- velocity del sprint
- Features asumidas
- Bugs trabajados
- Tasks trabajadas
- incidencias pendientes
- PRs abiertos
- ramas activas
- alertas importantes
- módulos más trabajados
- carga histórica por sprint
- velocity histórica por sprint
- comparación de asumido vs trabajado

### Dashboard del supervisor

- vista general por grupo
- filtros por desarrollador
- filtros por grupo
- carga por desarrollador
- velocity por desarrollador
- velocity por grupo
- PRs pendientes
- ramas antiguas
- incidencias bloqueadas
- comparación de asumido vs trabajado por persona o grupo

## 11. Notificaciones

Al entrar al dashboard, mostrar notificaciones sobre el estado del trabajo:

- ramas con mucho tiempo creadas
- PRs con mucho tiempo sin mergear
- ramas mergeadas pero no eliminadas
- incidencias asumidas sin PR registrado
- incidencias con rama pero sin PR
- incidencias en Waiting For Dependency
- incidencias cercanas al cierre del sprint sin estar completadas
- trabajo registrado que no estaba en el compromiso inicial del sprint

Los límites exactos deben ser configurables más adelante. Ejemplos:

- PR abierto por más de 2 días
- Rama activa por más de 3 días
- Rama mergeada sin eliminar por más de 1 día

## 12. Reportes

Generación en PDF.

### Reporte inicial del sprint

Se genera al asumir las tareas al inicio del sprint. Incluye:

- sprint
- fecha de inicio
- hora de finalización del sprint planning
- desarrollador
- incidencias asumidas
- tipo de incidencia
- puntos de Features
- módulo técnico
- total de puntos asumidos
- cantidad de Features
- cantidad de Bugs
- cantidad de Tasks
- distribución por módulo técnico

### Reporte semanal

Se genera al final de cada semana. Incluye:

- lo asumido
- lo trabajado
- incidencias completadas
- incidencias pendientes
- incidencias nuevas no asumidas inicialmente
- PRs abiertos
- PRs mergeados
- ramas activas
- ramas eliminadas
- Bugs y Tasks trabajados
- avance por módulo técnico
- comparación entre compromiso inicial y trabajo real

### Reporte final del sprint

Incluye:

- puntos asumidos
- puntos completados
- velocity
- porcentaje de cumplimiento
- Features completadas
- Bugs trabajados
- Tasks trabajadas
- módulos más trabajados
- incidencias fuera del planning
- tiempo promedio hasta merge
- PRs que tardaron más
- ramas que duraron más tiempo
- pendientes al cierre del sprint

## 13. Primera versión esperada

Enfoque: registro manual de sprint, incidencias, módulos, ramas y PRs.

Debe permitir generar al menos:

- dashboard personal
- reporte inicial del sprint
- reporte semanal
- reporte final del sprint
- métricas básicas de carga y velocity

La integración automática con Jira y Bitbucket NO entra en la primera versión.

## 14. Requerimiento visual

Identidad visual sobria, profesional y orientada a productividad, basada en
esta paleta:

| Color | Hex | Uso recomendado |
|---|---|---|
| Lavanda grisáceo | `#B2ADD0` | Fondos suaves, cards secundarias, gráficos ligeros |
| Beige oliva claro | `#D1CDAE` | Fondo principal claro, secciones, superficies |
| Púrpura oscuro | `#564F7C` | Color principal, botones primarios, headers, navegación |
| Verde oliva oscuro | `#524C26` | Texto fuerte, acentos serios, estados destacados |

Variables base:

```css
:root {
  --color-primary: #564F7C;
  --color-primary-soft: #B2ADD0;
  --color-background: #D1CDAE;
  --color-surface: #F4F1E3;
  --color-accent: #524C26;
  --color-text-primary: #25231A;
  --color-text-secondary: #564F7C;
  --color-border: #B2ADD0;

  /* Estados del sistema (alertas, notificaciones) */
  --color-success: #3F7D58;
  --color-warning: #B8872B;
  --color-danger: #A94442;
  --color-info: #4D6FA9;
}
```

Uso:

- Principal `#564F7C`: botones importantes (Crear sprint, Generar reporte,
  Guardar incidencia).
- Fondo: `#F4F1E3` (variante clara del beige) para pantallas grandes;
  `#D1CDAE` para secciones.
- Secundario `#B2ADD0`: tarjetas, etiquetas, filtros, contenedores de
  métricas y gráficos.
- Acento `#524C26`: detalles visuales, estados importantes, títulos fuertes.
- Estados (success/warning/danger/info): notificaciones tipo PR viejo, rama
  abierta, incidencias bloqueadas. No representar estados solo con púrpura y
  oliva.

La interfaz debe priorizar legibilidad en dashboards, reportes y tablas.
