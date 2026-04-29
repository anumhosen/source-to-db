// src/components/RepoCard.jsx
export default function RepoCard({ repo, onOpenEditor, onOpenDocs, onDelete, onGenerateAllAI }) {
    return (
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col'>
            <h2 className='text-lg font-semibold text-gray-100'>{repo.name}</h2>
            <p className='text-sm text-gray-400'>
                v{repo.version} · {repo.source}
            </p>
            <div className='mt-3 flex flex-wrap gap-2'>
                <button
                    onClick={onOpenEditor}
                    className='px-3 py-1 bg-gray-800 rounded hover:bg-gray-700'
                >
                    Editor
                </button>
                <button
                    onClick={onOpenDocs}
                    className='px-3 py-1 bg-gray-800 rounded hover:bg-gray-700'
                >
                    Docs
                </button>
                <button
                    onClick={onGenerateAllAI}
                    className='px-3 py-1 bg-indigo-900 rounded hover:bg-indigo-800'
                >
                    Explain All
                </button>
                <button
                    onClick={onDelete}
                    className='px-3 py-1 bg-red-900 rounded hover:bg-red-800 ml-auto'
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
