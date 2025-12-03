import React from 'react';

// Simple parser to render Markdown tables and basic formatting from Gemini output
export const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const renderedLines: React.ReactNode[] = [];
  
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];
  let tableAlignments: string[] = [];

  const renderText = (text: string) => {
    // Basic bold parsing: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-green-400 font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Basic link parsing: [title](url) - usually from search grounding citations
      // Note: Gemini grounding chunks are separate, but sometimes it outputs standard md links
      return <span key={index}>{part}</span>;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for table row
    if (line.startsWith('|') && line.endsWith('|')) {
      const rowContent = line.split('|').map(c => c.trim()).filter(c => c !== '');
      
      if (!inTable) {
        // Start of new table?
        // Look ahead to see if next line is a separator line (e.g. |---|---|)
        if (i + 1 < lines.length && lines[i+1].trim().startsWith('|') && lines[i+1].includes('---')) {
          inTable = true;
          tableHeader = rowContent;
          // Skip the separator line in next iteration
          i++; 
          continue;
        }
      } else {
        // Already in table
        tableRows.push(rowContent);
      }
    } else {
      // If we were in a table, close it and render
      if (inTable) {
        renderedLines.push(
          <div key={`table-${i}`} className="overflow-x-auto my-4 border border-gray-700 rounded-lg shadow-lg">
            <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
              <thead className="bg-gray-700/50">
                <tr>
                  {tableHeader.map((th, idx) => (
                    <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                        {renderText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableHeader = [];
        tableRows = [];
      }

      // Normal text rendering
      if (line === '') {
        renderedLines.push(<br key={i} />);
      } else if (line.startsWith('###')) {
        renderedLines.push(<h3 key={i} className="text-xl font-bold text-white mt-4 mb-2">{renderText(line.replace('###', ''))}</h3>);
      } else if (line.startsWith('##')) {
        renderedLines.push(<h2 key={i} className="text-2xl font-bold text-green-400 mt-6 mb-3 border-b border-gray-700 pb-2">{renderText(line.replace('##', ''))}</h2>);
      } else if (line.startsWith('- ')) {
        renderedLines.push(
          <li key={i} className="ml-4 list-disc text-gray-300 pl-2 py-1">
            {renderText(line.replace('- ', ''))}
          </li>
        );
      } else {
        renderedLines.push(<p key={i} className="text-gray-300 mb-2 leading-relaxed">{renderText(line)}</p>);
      }
    }
  }

  // Flush any remaining table
  if (inTable) {
     renderedLines.push(
        <div key="table-end" className="overflow-x-auto my-4 border border-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-700 bg-gray-800">
            <thead className="bg-gray-700/50">
              <tr>
                {tableHeader.map((th, idx) => (
                  <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2 whitespace-nowrap text-sm text-gray-200">
                      {renderText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }

  return <div className="space-y-1">{renderedLines}</div>;
};