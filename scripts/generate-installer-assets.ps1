$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$installerDir = Join-Path $projectRoot "assets\installer"
$logoPath = Join-Path $projectRoot "boocord_logo.png"

if (-not (Test-Path $logoPath)) {
    throw "Logo nicht gefunden: $logoPath"
}

if (-not (Test-Path $installerDir)) {
    New-Item -ItemType Directory -Path $installerDir | Out-Null
}

function New-Color {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Hex,
        [int]$Alpha = 255
    )

    $color = [System.Drawing.ColorTranslator]::FromHtml($Hex)
    return [System.Drawing.Color]::FromArgb($Alpha, $color.R, $color.G, $color.B)
}

function New-RoundedRectPath {
    param(
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$Radius
    )

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = [Math]::Min($Radius * 2, [Math]::Min($Width, $Height))

    if ($diameter -le 0) {
        $path.AddRectangle((New-Object System.Drawing.RectangleF($X, $Y, $Width, $Height)))
        return $path
    }

    $arc = New-Object System.Drawing.RectangleF($X, $Y, $diameter, $diameter)
    $path.AddArc($arc, 180, 90)
    $arc.X = $X + $Width - $diameter
    $path.AddArc($arc, 270, 90)
    $arc.Y = $Y + $Height - $diameter
    $path.AddArc($arc, 0, 90)
    $arc.X = $X
    $path.AddArc($arc, 90, 90)
    $path.CloseFigure()
    return $path
}

function Add-GridLines {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$Width,
        [int]$Height,
        [int]$Spacing = 26
    )

    $pen = New-Object System.Drawing.Pen((New-Color "#5FB0FF" 20), 1)
    try {
        for ($offset = -$Height; $offset -lt ($Width + $Height); $offset += $Spacing) {
            $Graphics.DrawLine($pen, $offset, 0, $offset + $Height, $Height)
        }
    } finally {
        $pen.Dispose()
    }
}

function Add-Glow {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [string]$Hex,
        [int]$Alpha
    )

    $brush = New-Object System.Drawing.SolidBrush((New-Color $Hex $Alpha))
    try {
        $Graphics.FillEllipse($brush, $X, $Y, $Width, $Height)
    } finally {
        $brush.Dispose()
    }
}

function Draw-Panel {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$Radius,
        [string]$StartHex,
        [string]$EndHex,
        [string]$BorderHex
    )

    $path = New-RoundedRectPath -X $X -Y $Y -Width $Width -Height $Height -Radius $Radius
    $rect = New-Object System.Drawing.RectangleF($X, $Y, $Width, $Height)
    $fill = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, (New-Color $StartHex), (New-Color $EndHex), 45)
    $border = New-Object System.Drawing.Pen((New-Color $BorderHex 170), 1.4)

    try {
        $Graphics.FillPath($fill, $path)
        $Graphics.DrawPath($border, $path)
    } finally {
        $fill.Dispose()
        $border.Dispose()
        $path.Dispose()
    }
}

function Draw-Wordmark {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Size
    )

    $font = New-Object System.Drawing.Font("Segoe UI Semibold", $Size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $accentFont = New-Object System.Drawing.Font("Segoe UI Semibold", $Size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $whiteBrush = New-Object System.Drawing.SolidBrush((New-Color "#F8FBFF"))
    $accentBrush = New-Object System.Drawing.SolidBrush((New-Color "#5FB0FF"))

    try {
        $booSize = $Graphics.MeasureString("Boo", $font)
        $Graphics.DrawString("Boo", $font, $whiteBrush, $X, $Y)
        $Graphics.DrawString("cord", $accentFont, $accentBrush, $X + $booSize.Width - 2, $Y)
    } finally {
        $font.Dispose()
        $accentFont.Dispose()
        $whiteBrush.Dispose()
        $accentBrush.Dispose()
    }
}

function Save-Header {
    param(
        [System.Drawing.Image]$Logo
    )

    $bitmap = New-Object System.Drawing.Bitmap(150, 57, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    try {
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

        $backgroundRect = New-Object System.Drawing.RectangleF(0, 0, 150, 57)
        $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            $backgroundRect,
            (New-Color "#09131F"),
            (New-Color "#14253A"),
            0
        )

        try {
            $graphics.FillRectangle($backgroundBrush, $backgroundRect)
        } finally {
            $backgroundBrush.Dispose()
        }

        Add-Glow -Graphics $graphics -X 68 -Y -18 -Width 98 -Height 78 -Hex "#00D4FF" -Alpha 38
        Add-Glow -Graphics $graphics -X 18 -Y 4 -Width 48 -Height 48 -Hex "#3C9DFF" -Alpha 28
        Add-GridLines -Graphics $graphics -Width 150 -Height 57 -Spacing 22
        Draw-Panel -Graphics $graphics -X 9 -Y 8 -Width 38 -Height 38 -Radius 11 -StartHex "#1B2E45" -EndHex "#0F1927" -BorderHex "#5FB0FF"

        $graphics.DrawImage($Logo, (New-Object System.Drawing.RectangleF(13, 12, 30, 30)))

        $titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 13.2, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $subtitleFont = New-Object System.Drawing.Font("Segoe UI", 7.8, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
        $titleBrush = New-Object System.Drawing.SolidBrush((New-Color "#F8FBFF"))
        $subtitleBrush = New-Object System.Drawing.SolidBrush((New-Color "#9CCEFF"))
        $linePen = New-Object System.Drawing.Pen((New-Color "#3C9DFF" 95), 1)

        try {
            $graphics.DrawString("Boocord", $titleFont, $titleBrush, 55, 10)
            $graphics.DrawString("Launcher Setup", $subtitleFont, $subtitleBrush, 56, 29)
            $graphics.DrawLine($linePen, 56, 42, 133, 42)
        } finally {
            $titleFont.Dispose()
            $subtitleFont.Dispose()
            $titleBrush.Dispose()
            $subtitleBrush.Dispose()
            $linePen.Dispose()
        }

        $headerPath = Join-Path $installerDir "installerHeader.bmp"
        $bitmap.Save($headerPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

function Save-Sidebar {
    param(
        [System.Drawing.Image]$Logo
    )

    $bitmap = New-Object System.Drawing.Bitmap(164, 314, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    try {
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

        $backgroundRect = New-Object System.Drawing.RectangleF(0, 0, 164, 314)
        $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            $backgroundRect,
            (New-Color "#08111B"),
            (New-Color "#132338"),
            90
        )

        try {
            $graphics.FillRectangle($backgroundBrush, $backgroundRect)
        } finally {
            $backgroundBrush.Dispose()
        }

        Add-Glow -Graphics $graphics -X -44 -Y -30 -Width 188 -Height 150 -Hex "#3C9DFF" -Alpha 30
        Add-Glow -Graphics $graphics -X 36 -Y 14 -Width 108 -Height 108 -Hex "#00D4FF" -Alpha 26
        Add-Glow -Graphics $graphics -X -28 -Y 196 -Width 140 -Height 120 -Hex "#5FB0FF" -Alpha 18
        Add-GridLines -Graphics $graphics -Width 164 -Height 314 -Spacing 24

        $dividerPen = New-Object System.Drawing.Pen((New-Color "#5FB0FF" 48), 1)
        try {
            $graphics.DrawLine($dividerPen, 20, 188, 144, 188)
        } finally {
            $dividerPen.Dispose()
        }

        Draw-Panel -Graphics $graphics -X 28 -Y 24 -Width 108 -Height 108 -Radius 26 -StartHex "#132338" -EndHex "#0C1623" -BorderHex "#5FB0FF"
        Draw-Panel -Graphics $graphics -X 38 -Y 34 -Width 88 -Height 88 -Radius 22 -StartHex "#1D3550" -EndHex "#112033" -BorderHex "#00D4FF"
        $graphics.DrawImage($Logo, (New-Object System.Drawing.RectangleF(48, 44, 68, 68)))

        Draw-Wordmark -Graphics $graphics -X 23 -Y 150 -Size 18

        $subtitleFont = New-Object System.Drawing.Font("Segoe UI", 9.1, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
        $bodyFont = New-Object System.Drawing.Font("Segoe UI", 8.6, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
        $chipFont = New-Object System.Drawing.Font("Segoe UI Semibold", 8.2, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $whiteBrush = New-Object System.Drawing.SolidBrush((New-Color "#F4FBFF"))
        $mutedBrush = New-Object System.Drawing.SolidBrush((New-Color "#9CCEFF"))
        $chipTextBrush = New-Object System.Drawing.SolidBrush((New-Color "#D9F4FF"))
        $chipBorderPen = New-Object System.Drawing.Pen((New-Color "#3C9DFF" 95), 1)
        $chipFillBrush = New-Object System.Drawing.SolidBrush((New-Color "#0F1826" 255))
        $dotBrush = New-Object System.Drawing.SolidBrush((New-Color "#00D4FF"))

        try {
            $graphics.DrawString("Launcher Setup im", $subtitleFont, $mutedBrush, 24, 178)
            $graphics.DrawString("gleichen Look wie der Client.", $subtitleFont, $mutedBrush, 24, 192)
            $graphics.DrawString("Kein Standard-Wizard mehr.", $bodyFont, $whiteBrush, 24, 214)

            $chipLabels = @(
                "Im Boocord-Look",
                "Nur für diesen Nutzer",
                "In wenigen Klicks bereit"
            )

            for ($index = 0; $index -lt $chipLabels.Length; $index++) {
                $y = 244 + ($index * 22)
                $chipPath = New-RoundedRectPath -X 18 -Y $y -Width 128 -Height 18 -Radius 9

                try {
                    $graphics.FillPath($chipFillBrush, $chipPath)
                    $graphics.DrawPath($chipBorderPen, $chipPath)
                } finally {
                    $chipPath.Dispose()
                }

                $graphics.FillEllipse($dotBrush, 25, $y + 5, 8, 8)
                $graphics.DrawString($chipLabels[$index], $chipFont, $chipTextBrush, 39, $y + 2)
            }
        } finally {
            $subtitleFont.Dispose()
            $bodyFont.Dispose()
            $chipFont.Dispose()
            $whiteBrush.Dispose()
            $mutedBrush.Dispose()
            $chipTextBrush.Dispose()
            $chipBorderPen.Dispose()
            $chipFillBrush.Dispose()
            $dotBrush.Dispose()
        }

        $sidebarPath = Join-Path $installerDir "installerSidebar.bmp"
        $bitmap.Save($sidebarPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

$logo = [System.Drawing.Image]::FromFile($logoPath)

try {
    Save-Header -Logo $logo
    Save-Sidebar -Logo $logo
} finally {
    $logo.Dispose()
}
