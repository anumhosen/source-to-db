import { useState } from 'react';

// Build tree structure from flat file list
const buildTree = (files) => {
    if (!files || !Array.isArray(files)) return {};

    const root = {};

    files.forEach((f) => {
        if (!f || !f.filepath) return;

        const parts = f.filepath.split('/');
        let current = root;

        parts.forEach((part, i) => {
            if (!part) return;

            if (i === parts.length - 1) {
                // Leaf node (file)
                current[part] = { ...f, _isFile: true };
            } else {
                // Directory node
                if (!current[part] || current[part]._isFile) {
                    current[part] = {};
                }
                current = current[part];
            }
        });
    });

    return root;
};

// Recursive tree node component
const TreeNode = ({ name, node, depth = 0, onSelect, selectedId }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!node) return null;

    // File node
    if (node._isFile) {
        return (
            <div
                className={`flex items-center gap-2 px-2 py-1 cursor-pointer text-sm transition-colors
          ${
              selectedId === node.id
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
          }`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={() => onSelect(node.id)}
            >
                <svg
                    className='w-4 h-4 flex-shrink-0 text-gray-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                </svg>
                <span className='truncate'>{name}</span>
            </div>
        );
    }

    // Directory node
    const children = Object.entries(node);

    return (
        <div>
            <div
                className='flex items-center gap-2 px-2 py-1 cursor-pointer text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors'
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <svg
                    className={`w-3 h-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M9 5l7 7-7 7'
                    />
                </svg>
                <svg
                    className='w-4 h-4 flex-shrink-0 text-gray-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
                    />
                </svg>
                <span className='truncate font-medium'>{name}</span>
            </div>
            {isOpen &&
                children.map(([childName, childNode]) => (
                    <TreeNode
                        key={childName}
                        name={childName}
                        node={childNode}
                        depth={depth + 1}
                        onSelect={onSelect}
                        selectedId={selectedId}
                    />
                ))}
        </div>
    );
};

export default function FileTree({ files, onSelect, selectedId }) {
    const tree = buildTree(files);

    if (!files || files.length === 0) {
        return <div className='p-4 text-gray-500 text-sm'>No files found</div>;
    }

    return (
        <div className='h-full overflow-y-auto p-2'>
            {Object.entries(tree).map(([name, node]) => (
                <TreeNode
                    key={name}
                    name={name}
                    node={node}
                    onSelect={onSelect}
                    selectedId={selectedId}
                />
            ))}
        </div>
    );
}
