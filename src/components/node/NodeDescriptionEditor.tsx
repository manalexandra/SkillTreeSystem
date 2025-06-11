import React from 'react';
import RichTextEditor from './RichTextEditor';

interface NodeDescriptionEditorProps {
  content: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
  nodeId?: string;
}

const NodeDescriptionEditor: React.FC<NodeDescriptionEditorProps> = ({
  content,
  onChange,
  readOnly = false,
  nodeId
}) => {
  const handleChange = (html: string, json?: any) => {
    onChange(html);
  };

  return (
    <RichTextEditor
      content={content}
      onChange={handleChange}
      readOnly={readOnly}
      nodeId={nodeId}
      placeholder={readOnly ? "" : "Add a detailed description of this skill..."}
      className="min-h-[300px]"
    />
  );
};

export default NodeDescriptionEditor;