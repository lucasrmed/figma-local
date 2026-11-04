$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Threading;
public static class FigmaLocalClipboard {
    [DllImport("user32.dll")] public static extern uint GetClipboardSequenceNumber();
    [DllImport("user32.dll")] static extern bool OpenClipboard(IntPtr owner);
    [DllImport("user32.dll")] static extern bool CloseClipboard();
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern uint RegisterClipboardFormat(string name);
    [DllImport("user32.dll")] static extern IntPtr GetClipboardData(uint format);
    [DllImport("kernel32.dll")] static extern UIntPtr GlobalSize(IntPtr memory);
    [DllImport("kernel32.dll")] static extern IntPtr GlobalLock(IntPtr memory);
    [DllImport("kernel32.dll")] static extern bool GlobalUnlock(IntPtr memory);
    public static string ReadHtml() {
        bool opened = false;
        for (int i = 0; i < 20; i++) {
            if (OpenClipboard(IntPtr.Zero)) { opened = true; break; }
            Thread.Sleep(50);
        }
        if (!opened) throw new Exception("Clipboard ocupado. Copie novamente e tente importar.");
        try {
            uint format = RegisterClipboardFormat("HTML Format");
            IntPtr handle = GetClipboardData(format);
            if (handle == IntPtr.Zero) throw new Exception("Copie os objetos no Figma antes de importar.");
            ulong length = GlobalSize(handle).ToUInt64();
            if (length == 0 || length > 128UL * 1024 * 1024) throw new Exception("Copia vazia ou muito grande. Capture uma selecao menor.");
            IntPtr data = GlobalLock(handle);
            if (data == IntPtr.Zero) throw new Exception("Nao consegui ler a copia. Tente novamente.");
            try {
                byte[] bytes = new byte[(int)length];
                Marshal.Copy(data, bytes, 0, bytes.Length);
                return Convert.ToBase64String(bytes);
            } finally { GlobalUnlock(handle); }
        } finally { CloseClipboard(); }
    }
}
'@
while ($null -ne ($line = [Console]::ReadLine())) {
    $request = $null
    try {
        $request = ConvertFrom-Json -InputObject $line
        switch ($request.method) {
            'count' {
                $result = [FigmaLocalClipboard]::GetClipboardSequenceNumber()
                if ($result -eq 0) { throw 'Clipboard indisponivel nesta sessao do Windows.' }
            }
            'read' { $result = [FigmaLocalClipboard]::ReadHtml() }
            default { throw 'Operacao de clipboard invalida.' }
        }
        $response = @{ id = $request.id; ok = $true; result = $result }
    } catch { $response = @{ id = $request.id; ok = $false; error = $_.Exception.Message } }
    [Console]::WriteLine((ConvertTo-Json -InputObject $response -Compress -Depth 4))
}
