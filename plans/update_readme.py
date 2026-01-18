import datetime
import os
from pathlib import Path

def update_readme():
    # 1. Definir rutas relativas (Script en plans/, README en raíz)
    script_path = Path(__file__).resolve()
    base_dir = script_path.parent.parent
    readme_path = base_dir / "README.md"
    roadmap_path = base_dir / "plans" / "roadmap.md"

    # 2. Definir las marcas de inicio y fin
    START_MARKER = ""
    END_MARKER = ""

    if not readme_path.exists():
        print(f"Error: No se encontró el archivo {readme_path}")
        return

    # 3. Generar el contenido dinámico (Ejemplo: Fecha y Roadmap)
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    dynamic_content = f"\n### 📊 Estado del Proyecto\n"
    dynamic_content += f"- **Última actualización:** {now}\n"
    
    # Opcional: Intentar leer algo del roadmap para ponerlo en el README
    if roadmap_path.exists():
        with open(roadmap_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            # Tomamos las primeras 3 líneas como resumen
            summary = "".join(lines[:3]).strip()
            dynamic_content += f"- **Resumen del Roadmap:**\n  > {summary}\n"

    # 4. Leer el README actual
    with open(readme_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 5. Reemplazar el contenido entre las marcas
    try:
        start_idx = content.index(START_MARKER) + len(START_MARKER)
        end_idx = content.index(END_MARKER)
        
        new_readme_content = (
            content[:start_idx] + 
            "\n" + dynamic_content + "\n" + 
            content[end_idx:]
        )

        # 6. Escribir los cambios de vuelta al archivo
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(new_readme_content)
            
        print("✅ README.md actualizado con éxito.")

    except ValueError:
        print("❌ Error: No se encontraron las marcas en el README.")

if __name__ == "__main__":
    update_readme()