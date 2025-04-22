import os
import subprocess
import argparse
import sys

def convert_docx_to_md(docx_path, output_dir):
    """
    Конвертирует DOCX файл в Markdown с извлечением изображений.

    Args:
        docx_path (str): Путь к входному DOCX файлу.
        output_dir (str): Директория для сохранения MD файла и папки с изображениями.
    """
    if not os.path.exists(docx_path):
        print(f"Ошибка: Файл не найден: {docx_path}", file=sys.stderr)
        sys.exit(1)

    # Создаем выходную директорию, если она не существует
    os.makedirs(output_dir, exist_ok=True)

    # Определяем имя выходного файла и путь к нему
    base_name = os.path.splitext(os.path.basename(docx_path))[0]
    md_filename = f"{base_name}.md"
    md_path = os.path.join(output_dir, md_filename)

    # Определяем имя папки для медиафайлов и путь к ней
    media_folder_name = "media" # Имя папки можно изменить
    media_path = os.path.join(output_dir, media_folder_name)

    # Формируем команду Pandoc
    # Используем gfm (GitHub Flavored Markdown) для лучшей совместимости
    # --extract-media указывает Pandoc извлечь изображения в указанную папку
    pandoc_command = [
        "pandoc",
        docx_path,
        "-o", md_path,
        "-t", "gfm", # или 'markdown_strict', 'commonmark' и т.д.
        f"--extract-media={media_path}"
    ]

    print(f"Конвертация {docx_path} в {md_path}...")
    print(f"Изображения будут сохранены в: {media_path}")

    try:
        # Выполняем команду Pandoc
        result = subprocess.run(pandoc_command, check=True, capture_output=True, text=True, encoding='utf-8')
        print("Конвертация успешно завершена.")
        if result.stderr:
            print("Предупреждения Pandoc:", file=sys.stderr)
            print(result.stderr, file=sys.stderr)

    except FileNotFoundError:
        print("Ошибка: Команда 'pandoc' не найдена.", file=sys.stderr)
        print("Убедитесь, что Pandoc установлен и добавлен в PATH.", file=sys.stderr)
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"Ошибка при выполнении Pandoc:", file=sys.stderr)
        print(f"Команда: {' '.join(e.cmd)}", file=sys.stderr)
        print(f"Код возврата: {e.returncode}", file=sys.stderr)
        print(f"Stderr: {e.stderr}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
         print(f"Произошла непредвиденная ошибка: {e}", file=sys.stderr)
         sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Конвертировать DOCX в Markdown с извлечением изображений с помощью Pandoc.")
    parser.add_argument("input_docx", help="Путь к входному DOCX файлу.")
    parser.add_argument("-o", "--output-dir", default=".", help="Директория для сохранения результата (по умолчанию: текущая директория).")

    args = parser.parse_args()

    convert_docx_to_md(args.input_docx, args.output_dir)