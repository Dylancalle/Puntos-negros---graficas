# Puntos-negros---graficas

# Necesitamos realizar los siguientes cambios de manera gradual:

# Duplicar GitHubRepository:
# Crear una copia del archivo GitHubRepository, y renombrarlo como TddLabRepository.

# Los métodos deben mantenerse iguales.

# La única diferencia será que TddLabRepository no leerá datos desde GitHub, sino desde un archivo de log.

# Modificar las gráficas:
# Ir cambiando una por una las gráficas que actualmente utilizan datos desde GitHubAction, para que utilicen los datos del log proporcionado por TddLabRepository.

# La interfaz (inputs/outputs) debe mantenerse idéntica, para que las gráficas no necesiten rediseño.

# Actualizar GitHubApiAdapter:
# Crear una nueva versión que lea desde el log en vez de conectarse a GitHub.

# Esta nueva clase o función debe reemplazar el uso de GitHubApiAdapter en los componentes donde sea necesario.

# Arreglar el tema de los colores de las graficas aun sigue siendo negro y el tema de los colores 

# Graficas
# Cantidad de pruebas (color) Dylan
# Lineas de codigo (color) Ale
# Cobertura (color) Libia
# Dashbord principal (color)Juan
