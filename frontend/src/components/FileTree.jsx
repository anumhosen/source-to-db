import { useState, useMemo } from 'react';
import { VscChevronRight, VscChevronDown, VscCode, VscFileCode } from 'react-icons/vsc';

/**
 * Build a nested file tree from flat file list
 */
function buildFileTree(files) {
  if (!files || !Array.isArray(files)) return {};

  const tree = {};
  files.forEach((file) => {
    if (!file || !file.filepath) return;
    const parts = file.filepath.split('/');
    let current = tree;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        if (!current._files) current._files = [];
        current._files.push(file);
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    });
  });
  return tree;
}

/**
 * Recursive tree node renderer
 */
function TreeNode({
  name,
  node,
  path = '',
  depth = 0,
  onSelect,
  selectedId,
  expandedDirs,
  onToggle,
}) {
  // Directory node
  if (!node.id && !node._isFile) {
    const isExpanded = expandedDirs.has(path || name);
    const childEntries = Object.entries(node).filter(([key]) => key !== '_files');
    const childFiles = node._files || [];

    return (
      <div>
        <button
          onClick={() => onToggle(path || name)}
          className='w-full flex items-center gap-1 px-2 py-1 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors'
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
        >
          {isExpanded ? (
            <VscChevronDown className='w-3.5 h-3.5 flex-shrink-0' />
          ) : (
            <VscChevronRight className='w-3.5 h-3.5 flex-shrink-0' />
          )}
          <VscFileCode className='w-3.5 h-3.5 flex-shrink-0 text-gray-500' />
          <span className='truncate'>{name}</span>
        </button>
        {isExpanded && (
          <div>
            {childEntries.map(([childName, childNode]) => (
              <TreeNode
                key={childName}
                name={childName}
                node={childNode}
                path={path ? `${path}/${childName}` : childName}
                depth={depth + 1}
                onSelect={onSelect}
                selectedId={selectedId}
                expandedDirs={expandedDirs}
                onToggle={onToggle}
              />
            ))}
            {childFiles.map((file) => (
              <FileNode
                key={file.id}
                file={file}
                depth={depth + 1}
                onSelect={onSelect}
                selectedId={selectedId}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // It's a file at root level
  return <FileNode file={node} depth={depth} onSelect={onSelect} selectedId={selectedId} />;
}

/**
 * File node renderer
 */
function FileNode({ file, depth, onSelect, selectedId }) {
  const isActive = selectedId === file.id;
  const hasAI = file.header;

  return (
    <button
      onClick={() => onSelect(file.id)}
      className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors
              ${
                isActive
                  ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-800'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      <VscCode
        className={`w-3.5 h-3.5 flex-shrink-0 ${hasAI ? 'text-green-500' : 'text-gray-500'}`}
      />
      <span className='truncate flex-1 text-left'>{file.filename}</span>
      {hasAI && <span className='text-xs text-green-500'>AI</span>}
    </button>
  );
}

/**
 * Main FileTree component
 */
export default function FileTree({ files, onSelect, selectedId, searchQuery = '' }) {
  const [expandedDirs, setExpandedDirs] = useState(new Set());

  // Build file tree
  const fileTree = useMemo(() => {
    return buildFileTree(files);
  }, [files]);

  // Filter files by search
  const filteredFiles = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(
      (f) =>
        f.filename.toLowerCase().includes(query) ||
        f.filepath.toLowerCase().includes(query) ||
        (f.header && f.header.toLowerCase().includes(query)),
    );
  }, [files, searchQuery]);

  // Auto-expand first level if single directory
  useMemo(() => {
    if (files && files.length > 0 && expandedDirs.size === 0) {
      const entries = Object.entries(fileTree).filter(([key]) => key !== '_files');
      const rootFiles = fileTree._files || [];

      if (entries.length === 1 && rootFiles.length === 0) {
        const [dirName] = entries[0];
        setExpandedDirs(new Set([dirName]));
      }
    }
  }, [files, fileTree]);

  const toggleDir = (path) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Render tree
  const renderTree = (node, parentPath = '') => {
    const items = [];

    // Render directories
    Object.entries(node).forEach(([key, value]) => {
      if (key === '_files') return;
      const fullPath = parentPath ? `${parentPath}/${key}` : key;
      const isExpanded = expandedDirs.has(fullPath);

      items.push(
        <div key={fullPath}>
          <button
            onClick={() => toggleDir(fullPath)}
            className='w-full flex items-center gap-1 px-2 py-1 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors'
          >
            {isExpanded ? (
              <VscChevronDown className='w-3.5 h-3.5 flex-shrink-0' />
            ) : (
              <VscChevronRight className='w-3.5 h-3.5 flex-shrink-0' />
            )}
            <VscFileCode className='w-3.5 h-3.5 flex-shrink-0 text-gray-500' />
            <span className='truncate'>{key}</span>
          </button>
          {isExpanded && <div className='ml-3'>{renderTree(value, fullPath)}</div>}
        </div>,
      );
    });

    // Render files at this level
    if (node._files) {
      node._files.forEach((file) => {
        const isActive = selectedId === file.id;
        const hasAI = file.header;

        items.push(
          <button
            key={file.id}
            onClick={() => onSelect(file.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors
              ${
                isActive
                  ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-800'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
          >
            <VscCode
              className={`w-3.5 h-3.5 flex-shrink-0 ${hasAI ? 'text-green-500' : 'text-gray-500'}`}
            />
            <span className='truncate flex-1 text-left'>{file.filename}</span>
            {hasAI && <span className='text-xs text-green-500'>AI</span>}
          </button>,
        );
      });
    }

    return items;
  };

  return (
    <div className='h-full overflow-y-auto p-2'>
      {!files || files.length === 0 ? (
        <div className='flex items-center justify-center h-full'>
          <p className='text-sm text-gray-500'>No files found</p>
        </div>
      ) : searchQuery ? (
        // Flat list for search results
        filteredFiles.length === 0 ? (
          <div className='flex items-center justify-center h-full'>
            <p className='text-sm text-gray-500'>No files match "{searchQuery}"</p>
          </div>
        ) : (
          filteredFiles.map((file) => (
            <button
              key={file.id}
              onClick={() => onSelect(file.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors mb-0.5
                      ${
                        selectedId === file.id
                          ? 'bg-indigo-900/30 text-indigo-300'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      }`}
            >
              <VscCode className='w-3.5 h-3.5 flex-shrink-0' />
              <span className='truncate'>{file.filepath}</span>
            </button>
          ))
        )
      ) : (
        renderTree(fileTree)
      )}
    </div>
  );
}
