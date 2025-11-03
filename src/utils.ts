export function publishToApp(eventName: string, data: any) {
  if ((window as any).NewCoreC2APP) {
    const message = JSON.stringify({
      eventName,
      data,
    });
    (window as any).NewCoreC2APP.postMessage(message);
  }
}
