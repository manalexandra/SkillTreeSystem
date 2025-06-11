import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo, Heading1, Heading2, Heading3, Link as LinkIcon, Image as ImageIcon, Code, Strikethrough } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string, json?: any) => void;
  readOnly?: boolean;
  nodeId?: string;
  placeholder?: string;
  className?: string;
}

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string, text: string) => void;
  initialUrl?: string;
  initialText?: string;
}

const LinkModal: React.FC<LinkModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialUrl = '', 
  initialText = '' 
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setUrl(initialUrl);
    setText(initialText);
  }, [initialUrl, initialText]);

  const handleSave = () => {
    if (url.trim()) {
      onSave(url.trim(), text.trim() || url.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Add Link</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Text (optional)
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Link text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Add Link
          </button>
        </div>
      </div>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  readOnly = false,
  nodeId,
  placeholder = "Start writing...",
  className = ""
}) => {
  const { user } = useAuth();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [linkData, setLinkData] = useState({ url: '', text: '' });
  const [isInitialized, setIsInitialized] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: content || '<p></p>',
    editable: !readOnly,
    autofocus: !readOnly ? 'end' : false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      onChange(html, json);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 cursor-text',
        'data-placeholder': placeholder,
        spellcheck: 'true',
      },
      handleClick: (view, pos, event) => {
        // Ensure editor gets focus when clicked
        if (!readOnly) {
          view.focus();
        }
        return false;
      },
      handleKeyDown: (view, event) => {
        // Handle common keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case 'b':
              event.preventDefault();
              editor?.chain().focus().toggleBold().run();
              return true;
            case 'i':
              event.preventDefault();
              editor?.chain().focus().toggleItalic().run();
              return true;
            case 'z':
              if (event.shiftKey) {
                event.preventDefault();
                editor?.chain().focus().redo().run();
              } else {
                event.preventDefault();
                editor?.chain().focus().undo().run();
              }
              return true;
          }
        }
        return false;
      },
    },
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
  });

  // Initialize editor content and focus
  useEffect(() => {
    if (editor && !isInitialized) {
      // Set initial content
      if (content && content !== '<p></p>') {
        editor.commands.setContent(content, false);
      }
      
      // Focus the editor if not readonly
      if (!readOnly) {
        setTimeout(() => {
          editor.commands.focus('end');
        }, 100);
      }
      
      setIsInitialized(true);
    }
  }, [editor, content, readOnly, isInitialized]);

  // Update editor content when prop changes (but not on every render)
  useEffect(() => {
    if (editor && isInitialized && content !== editor.getHTML()) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(content || '<p></p>', false);
      // Restore cursor position if possible
      if (from === to && from > 0) {
        try {
          editor.commands.setTextSelection(Math.min(from, editor.state.doc.content.size));
        } catch (e) {
          // Ignore cursor position errors
        }
      }
    }
  }, [content, editor, isInitialized]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !nodeId) return;

    setUploadingImage(true);
    try {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image size must be less than 5MB');
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${nodeId}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('node-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('node-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // Save image metadata to database
      const { error: dbError } = await supabase
        .from('node_images')
        .insert({
          node_id: nodeId,
          filename: fileName,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: fileName,
          uploaded_by: user.id
        });

      if (dbError) {
        console.warn('Failed to save image metadata:', dbError);
      }

      // Insert image into editor
      if (editor) {
        editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      // Reset file input
      event.target.value = '';
    }
  }, [user, nodeId, editor]);

  const handleAddLink = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    setLinkData({ url: '', text: selectedText });
    setShowLinkModal(true);
  }, [editor]);

  const handleSaveLink = useCallback((url: string, text: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    
    if (from === to) {
      // No selection, insert new link
      editor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run();
    } else {
      // Selection exists, make it a link
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleEditorClick = useCallback(() => {
    if (!readOnly && editor) {
      editor.commands.focus();
    }
  }, [editor, readOnly]);

  if (!editor) {
    return (
      <div className="border rounded-lg p-4 min-h-[200px] flex items-center justify-center">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  const MenuButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }> = ({ onClick, active, disabled, children, title }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active
          ? 'bg-primary-100 text-primary-700'
          : 'text-gray-600 hover:bg-gray-100'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className={`border rounded-lg overflow-hidden bg-white ${className}`}>
      {!readOnly && (
        <div className="flex items-center gap-1 p-2 border-b bg-gray-50 flex-wrap">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </MenuButton>

            <MenuButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </MenuButton>

            <MenuButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive('code')}
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </MenuButton>
          </div>

          {/* Headings */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </MenuButton>

            <MenuButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </MenuButton>
          </div>
          
          {/* Lists */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </MenuButton>
          </div>

          {/* Media & Links */}
          <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
            <MenuButton
              onClick={handleAddLink}
              active={editor.isActive('link')}
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </MenuButton>

            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
              <MenuButton
                onClick={() => {}}
                disabled={uploadingImage}
                title="Upload Image"
              >
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </MenuButton>
            </label>
          </div>
          
          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <MenuButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </MenuButton>
            
            <MenuButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="h-4 w-4" />
            </MenuButton>
          </div>
        </div>
      )}
      
      <div 
        className="relative cursor-text"
        onClick={handleEditorClick}
        ref={editorRef}
      >
        <EditorContent 
          editor={editor} 
          className={`${readOnly ? 'cursor-default' : 'cursor-text'}`}
        />
        {!readOnly && editor.isEmpty && (
          <div 
            className="absolute top-4 left-4 text-gray-400 pointer-events-none select-none"
            onClick={handleEditorClick}
          >
            {placeholder}
          </div>
        )}
      </div>

      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSave={handleSaveLink}
        initialUrl={linkData.url}
        initialText={linkData.text}
      />

      <style jsx>{`
        .ProseMirror {
          outline: none !important;
          cursor: text;
        }
        .ProseMirror:focus {
          outline: none !important;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          margin: 1em 0 0.5em 0;
        }
        .ProseMirror ul, .ProseMirror ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          margin: 1em 0;
          padding-left: 1em;
          color: #6b7280;
        }
        .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5em;
          margin: 1em 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;