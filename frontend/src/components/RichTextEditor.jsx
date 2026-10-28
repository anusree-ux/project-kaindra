import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "./RichTextEditor.css";

export default function RichTextEditor({ value = "", onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const buttons = [
    {
        label: "Heading 1",
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        active: editor.isActive("heading", { level: 1 }),
    },
    {
        label: "Heading 2",
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        active: editor.isActive("heading", { level: 2 }),
    },
    {
        label: "Bold",
        action: () => editor.chain().focus().toggleBold().run(),
        active: editor.isActive("bold"),
    },
    {
        label: "Italic",
        action: () => editor.chain().focus().toggleItalic().run(),
        active: editor.isActive("italic"),
    },
    {
        label: "Bullet List",
        action: () => editor.chain().focus().toggleBulletList().run(),
        active: editor.isActive("bulletList"),
    },
    {
        label: "Numbered List",
        action: () => editor.chain().focus().toggleOrderedList().run(),
        active: editor.isActive("orderedList"),
    },
 ];


  return (
    <div className="rich-text-editor">
      <div className="rich-text-toolbar">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            className={button.active ? "active" : ""}
            aria-label={button.label}
            title={button.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={button.action}
          >
            {button.label}
          </button>
        ))}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}