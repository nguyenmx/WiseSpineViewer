import React, { useEffect, useState, useCallback } from 'react';
import { SidePanel, Header, InvestigationalUseDialog } from '@ohif/ui-next';
import { useToolbar, HangingProtocolService } from '@ohif/core';
import { Toolbar } from '@ohif/extension-default';
import { useAppConfig } from '@state';
import { useNavigate, useLocation } from 'react-router-dom';
import { preserveQueryParameters } from '@ohif/app';

// function SpineToolsPanel() {
//   const [activeTool, setActiveTool] = useState(null);

//   const tools = [
//     { id: 'segmentation', label: 'Segmentation', icon: '✂︎' },
//     { id: 'cobbAngle', label: 'Cobb Angle', icon: '∠' },
//     { id: 'vertebraLabel', label: 'Vertebra Label', icon: '▣' },
//     { id: 'discHeight', label: 'Disc Height', icon: '↕' },
//     { id: 'sagittalBalance', label: 'Sagittal Balance', icon: '⊥' },
//   ];

//   return (
//     <div className="flex flex-col w-64 bg-black text-white h-full overflow-y-auto">
//       <div className="px-3 py-2 border-b border-gray-700">
//         <h3 className="text-sm font-semibold text-white">Spine Tools</h3>
//       </div>
//       <div className="flex flex-col gap-1 p-2">
//         {tools.map(tool => (
//           <button
//             key={tool.id}
//             className={`flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${
//               activeTool === tool.id
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
//             }`}
//             onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
//           >
//             <span className="text-lg">{tool.icon}</span>
//             <span>{tool.label}</span>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

function ViewerHeader({ extensionManager, servicesManager, appConfig }) {
  const navigate = useNavigate();
  const location = useLocation();

  const onClickReturnButton = () => {
    const { pathname } = location;
    const dataSourceIdx = pathname.indexOf('/', 1);
    const dataSourceName = pathname.substring(dataSourceIdx + 1);
    const existingDataSource = extensionManager.getDataSources(dataSourceName);

    const searchQuery = new URLSearchParams();
    if (dataSourceIdx !== -1 && existingDataSource) {
      searchQuery.append('datasources', pathname.substring(dataSourceIdx + 1));
    }
    preserveQueryParameters(searchQuery);

    navigate({
      pathname: '/',
      search: decodeURIComponent(searchQuery.toString()),
    });
  };

  return (
    <Header
      menuOptions={[]}
      isReturnEnabled={!!appConfig.showStudyList}
      onClickReturnButton={onClickReturnButton}
      WhiteLabeling={appConfig.whiteLabeling}
      Secondary={<Toolbar buttonSection="secondary" />}
    >
      <div className="relative flex justify-center gap-[4px]">
        <Toolbar buttonSection="primary" />
      </div>
    </Header>
  );
}

function WiseSpineLayoutComponent({
  extensionManager,
  servicesManager,
  commandsManager,
  hotkeysManager,
  viewports,
  ViewportGridComp,
  leftPanelClosed = false,
  rightPanelClosed = false,
}) {
  const [appConfig] = useAppConfig();
  const { panelService, hangingProtocolService } = servicesManager.services;

  const [showLoadingIndicator, setShowLoadingIndicator] = useState(
    appConfig.showLoadingIndicator
  );

  // Panel state
  const hasPanels = useCallback(
    side => !!panelService.getPanels(side).length,
    [panelService]
  );

  const [hasLeftPanels, setHasLeftPanels] = useState(hasPanels('left'));
  const [hasRightPanels, setHasRightPanels] = useState(hasPanels('right'));
  const [leftTabs, setLeftTabs] = useState(panelService.getPanels('left'));
  const [rightTabs, setRightTabs] = useState(panelService.getPanels('right'));
  const [leftExpanded, setLeftExpanded] = useState(!leftPanelClosed);
  const [rightExpanded, setRightExpanded] = useState(!rightPanelClosed);
  const [leftActiveTabIndex, setLeftActiveTabIndex] = useState(0);
  const [rightActiveTabIndex, setRightActiveTabIndex] = useState(0);

  // Listen for panel changes
  useEffect(() => {
    const { unsubscribe } = panelService.subscribe(
      panelService.EVENTS.PANELS_CHANGED,
      ({ options }) => {
        setHasLeftPanels(hasPanels('left'));
        setHasRightPanels(hasPanels('right'));
        setLeftTabs(panelService.getPanels('left'));
        setRightTabs(panelService.getPanels('right'));
        if (options?.leftPanelClosed !== undefined) {
          setLeftExpanded(!options.leftPanelClosed);
        }
        if (options?.rightPanelClosed !== undefined) {
          setRightExpanded(!options.rightPanelClosed);
        }
      }
    );
    return () => unsubscribe();
  }, [panelService, hasPanels]);

  // Listen for panel activation
  useEffect(() => {
    const { unsubscribe } = panelService.subscribe(
      panelService.EVENTS.ACTIVATE_PANEL,
      activatePanelEvent => {
        const leftIdx = leftTabs.findIndex(
          tab => tab.id === activatePanelEvent.panelId
        );
        if (leftIdx !== -1) {
          setLeftExpanded(true);
          setLeftActiveTabIndex(leftIdx);
          return;
        }
        const rightIdx = rightTabs.findIndex(
          tab => tab.id === activatePanelEvent.panelId
        );
        if (rightIdx !== -1) {
          setRightExpanded(true);
          setRightActiveTabIndex(rightIdx);
        }
      }
    );
    return () => unsubscribe();
  }, [panelService, leftTabs, rightTabs]);

  // Hide loading indicator when protocol changes
  useEffect(() => {
    const { unsubscribe } = hangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      () => setShowLoadingIndicator(false)
    );
    return () => unsubscribe();
  }, [hangingProtocolService]);

  // Prevent body scrolling
  useEffect(() => {
    document.body.classList.add('bg-black', 'overflow-hidden');
    return () => {
      document.body.classList.remove('bg-black', 'overflow-hidden');
    };
  }, []);

  const getViewportComponentData = viewportComponent => {
    const entry = extensionManager.getModuleEntry(viewportComponent.namespace);
    return {
      component: entry.component,
      isReferenceViewable: entry.isReferenceViewable,
      displaySetsToDisplay: viewportComponent.displaySetsToDisplay,
    };
  };

  const viewportComponents = viewports.map(getViewportComponentData);

  return (
    <div>
      <ViewerHeader
        extensionManager={extensionManager}
        servicesManager={servicesManager}
        appConfig={appConfig}
      />
      <div
        className="relative flex w-full flex-row flex-nowrap items-stretch overflow-hidden bg-black"
        style={{ height: 'calc(100vh - 52px)' }}
      >
        {/* LEFT SIDE PANEL */}
        {hasLeftPanels && (
          <SidePanel
            side="left"
            tabs={leftTabs}
            activeTabIndex={leftActiveTabIndex}
            isExpanded={leftExpanded}
            onOpen={() => setLeftExpanded(true)}
            onClose={() => setLeftExpanded(false)}
            onActiveTabIndexChange={({ activeTabIndex }) =>
              setLeftActiveTabIndex(activeTabIndex)
            }
            expandedWidth={282}
            collapsedWidth={25}
          />
        )}

        {/* SPINE TOOLS PANEL */}
        {/* <SpineToolsPanel /> */}

        {/* VIEWPORT GRID */}
        <div className="flex h-full flex-1 flex-col">
          <div className="relative flex h-full flex-1 items-center justify-center overflow-hidden bg-black">
            <ViewportGridComp
              servicesManager={servicesManager}
              viewportComponents={viewportComponents}
              commandsManager={commandsManager}
            />
          </div>
        </div>

        {/* RIGHT SIDE PANEL */}
        {hasRightPanels && (
          <SidePanel
            side="right"
            tabs={rightTabs}
            activeTabIndex={rightActiveTabIndex}
            isExpanded={rightExpanded}
            onOpen={() => setRightExpanded(true)}
            onClose={() => setRightExpanded(false)}
            onActiveTabIndexChange={({ activeTabIndex }) =>
              setRightActiveTabIndex(activeTabIndex)
            }
            expandedWidth={280}
            collapsedWidth={25}
          />
        )}
      </div>
    </div>
  );
}

export default WiseSpineLayoutComponent;
