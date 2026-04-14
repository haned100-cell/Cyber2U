from docx import Document

DOCX_PATH = '/Users/nathanbrown-bennett/Haned-Cyber2U/Final Disso/Cyber2U_finished_dissertation_final.docx'


def main() -> None:
    doc = Document(DOCX_PATH)
    for idx, paragraph in enumerate(doc.paragraphs):
        text = paragraph.text.strip()
        if not text:
            continue
        style = paragraph.style.name if paragraph.style is not None else ''
        lower = text.lower()
        if 'methodology' in lower or 'result' in lower or style.startswith('Heading'):
            print(f'{idx:04d} | {style} | {text}')


if __name__ == '__main__':
    main()
