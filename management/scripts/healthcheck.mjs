const port = Number(process.env.PORT || 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) process.exit(1);

try {
  const response = await fetch(`http://127.0.0.1:${port}/healthz`, {
    redirect: 'error',
    signal: AbortSignal.timeout(5000),
  });
  await response.body?.cancel();
  if (response.status !== 200) process.exit(1);
} catch {
  process.exit(1);
}
