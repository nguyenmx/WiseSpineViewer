import WiseSpineLayoutComponent from './ViewerLayout/WiseSpineLayoutComponent';

export default function getLayoutTemplateModule({ servicesManager, extensionManager, commandsManager }) {
  function WiseSpineLayoutWithServices(props) {
    return WiseSpineLayoutComponent({
      servicesManager,
      extensionManager,
      commandsManager,
      ...props,
    });
  }

  return [
    {
      id: 'wiseSpineLayout',
      name: 'wiseSpineLayout',
      component: WiseSpineLayoutWithServices,
    },
  ];
}