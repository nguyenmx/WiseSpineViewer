import { id } from './id';
import { isValidMode, NON_IMAGE_MODALITIES } from '@ohif/mode-basic';
import getLayoutTemplateModule from './getLayoutTemplateModule';

export const wiseSpineRoute = {
  path: 'wiseSpine',
  layoutTemplate: () => {
    return {
      // Use the default layout template (registered by @ohif/extension-default)
      id: '@wisespine/extension-layout.layoutTemplateModule.wiseSpineLayout',
      props: {
        viewports: [
          {
            namespace: '@ohif/extension-cornerstone.viewportModule.cornerstone',
            displaySetsToDisplay: ['@ohif/extension-default.sopClassHandlerModule.stack'],
          },
        ],
      },
    };
  },
};

export const mode = {
  id: "wiseSpine",
  displayName: 'WiseSpine (Test)',
  routes: [wiseSpineRoute],
  extensions: {
    '@ohif/extension-default': '^3.12.0-beta.122',
    '@ohif/extension-cornerstone': '^3.12.0-beta.122',
    '@ohif/extension-measurement-tracking': '^3.12.0-beta.122',
    '@ohif/extension-cornerstone-dicom-sr': '^3.12.0-beta.122',
    '@wisespine/extension-layout': '0.0.1',
  },
  sopClassHandlers: ['@ohif/extension-default.sopClassHandlerModule.stack'],
  hotkeys: [],
  isValidMode,
  nonModeModalities: NON_IMAGE_MODALITIES,
  hide: false,

  onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
    console.log('Entering WiseSpine mode');
  },

  onModeExit: ({ servicesManager }) => {
    console.log('Exiting WiseSpine mode');
  },
};


export default mode;
