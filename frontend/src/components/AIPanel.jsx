export default function AIPanel({ fields, onChange }) {
    const update = (key, value) => {
        if (onChange) {
            onChange({ ...fields, [key]: value });
        }
    };

    return (
        <div className='flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden ml-1'>
            <div className='px-3 py-1 bg-gray-800 border-b border-gray-700'>
                <span className='text-xs text-gray-500 uppercase tracking-wider'>
                    AI Documentation
                </span>
            </div>

            <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                {/* Header */}
                <div>
                    <label className='block text-xs text-gray-500 mb-1.5 font-medium'>
                        Header / Title
                    </label>
                    <input
                        className='w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 
                       focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600'
                        value={fields?.header || ''}
                        onChange={(e) => update('header', e.target.value)}
                        placeholder='File title or summary...'
                    />
                </div>

                {/* Explanation */}
                <div className='flex-1'>
                    <label className='block text-xs text-gray-500 mb-1.5 font-medium'>
                        Explanation
                    </label>
                    <textarea
                        className='w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 
                       focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600 resize-none'
                        style={{ minHeight: '200px' }}
                        value={fields?.explanation || ''}
                        onChange={(e) => update('explanation', e.target.value)}
                        placeholder='AI-generated explanation will appear here...'
                    />
                </div>

                {/* Footnote */}
                <div>
                    <label className='block text-xs text-gray-500 mb-1.5 font-medium'>
                        Footnote / Notes
                    </label>
                    <textarea
                        className='w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 
                       focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600 resize-none'
                        style={{ minHeight: '80px' }}
                        value={fields?.footnote || ''}
                        onChange={(e) => update('footnote', e.target.value)}
                        placeholder='Additional notes, dependencies, edge cases...'
                    />
                </div>
            </div>
        </div>
    );
}
