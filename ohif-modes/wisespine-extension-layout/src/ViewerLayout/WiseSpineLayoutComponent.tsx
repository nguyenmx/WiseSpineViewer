import React, { useState } from 'react';

function SpineToolsPanel() {
  const [activeTool, setActiveTool] = useState(null);

  const tools = [
    { id: 'cobbAngle', label: 'Cobb Angle!', icon: '∠' },
    { id: 'vertebraLabel', label: 'Vertebra Label', icon: '▣' },
    { id: 'discHeight', label: 'Disc Height', icon: '↕' },
    { id: 'sagittalBalance', label: 'Sagittal Balance', icon: '⊥' },
  ];

  return (
    <div className="flex flex-col w-64 bg-black text-white h-full overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-white">Spine Tools</h3>
      </div>
      <div className="flex flex-col gap-1 p-2">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${
              activeTool === tool.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
          >
            <span className="text-lg">{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WiseSpineLayoutComponent({
  extensionManager,
  servicesManager,
  commandsManager,
  viewports,
  ViewportGridComp,
}) {
  const getViewportComponentData = viewportComponent => {
    const entry = extensionManager.getModuleEntry(viewportComponent.namespace);
    return {
      component: entry.component,
      displaySetsToDisplay: viewportComponent.displaySetsToDisplay,
    };
  };

  const viewportComponents = viewports.map(getViewportComponentData);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        <SpineToolsPanel />
        <div className="flex-1">
          <ViewportGridComp
            servicesManager={servicesManager}
            viewportComponents={viewportComponents}
            commandsManager={commandsManager}
          />
        </div>
      </div>
    </div>
  );
}

export default WiseSpineLayoutComponent;
