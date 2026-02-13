import { id } from './id';
import {
  ohif,
  cornerstone,
  segmentation,
  dicomRT,
  extensionDependencies,
  isValidMode,
  NON_IMAGE_MODALITIES,
  initToolGroups,
  toolbarButtons,
  toolbarSections,
} from '@ohif/mode-basic';

const wiseSpineRoute = {
  path: 'wiseSpine',
  layoutTemplate: () => {
    return {
      id: '@wisespine/extension-layout.layoutTemplateModule.wiseSpineLayout',
      props: {
        leftPanels: [ohif.thumbnailList],
        leftPanelResizable: true,
        rightPanels: [
          cornerstone.labelMapSegmentationPanel,
          cornerstone.contourSegmentationPanel,
        ],
        rightPanelResizable: true,
        viewports: [
          {
            namespace: cornerstone.viewport,
            displaySetsToDisplay: [ohif.sopClassHandler],
          },
          {
            namespace: segmentation.viewport,
            displaySetsToDisplay: [segmentation.sopClassHandler],
          },
          {
            namespace: dicomRT.viewport,
            displaySetsToDisplay: [dicomRT.sopClassHandler],
          },
        ],
      },
    };
  },
};

const mode = {
  id: 'wiseSpine',
  routeName: 'wiseSpine',
  displayName: 'WiseSpine',
  hide: false,

  onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
    const {
      measurementService,
      toolbarService,
      toolGroupService,
    } = servicesManager.services;

    measurementService.clearMeasurements();

    // Init tool groups (default, SR, MPR, volume3d)
    initToolGroups(extensionManager, toolGroupService, commandsManager);

    // Register toolbar buttons
    toolbarService.register(toolbarButtons);

    // Set up toolbar sections (primary toolbar, more tools, viewport menus, etc.)
    for (const [key, section] of Object.entries(toolbarSections)) {
      toolbarService.updateSection(key, section);
    }
  },

  onModeExit: ({ servicesManager }) => {
    const {
      toolGroupService,
      syncGroupService,
      segmentationService,
      cornerstoneViewportService,
      uiDialogService,
      uiModalService,
    } = servicesManager.services;

    uiDialogService.hideAll();
    uiModalService.hide();
    toolGroupService.destroy();
    syncGroupService.destroy();
    segmentationService.destroy();
    cornerstoneViewportService.destroy();
  },

  validationTags: {
    study: [],
    series: [],
  },

  isValidMode,

  routes: [wiseSpineRoute],

  extensions: {
    ...extensionDependencies,
    '@wisespine/extension-layout': '0.0.1',
  },

  hangingProtocol: '@ohif/mnGrid',

  sopClassHandlers: [
    ohif.sopClassHandler,
    segmentation.sopClassHandler,
    dicomRT.sopClassHandler,
  ],

  nonModeModalities: NON_IMAGE_MODALITIES,
};

export default mode;
