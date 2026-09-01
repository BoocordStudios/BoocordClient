!define MUI_ABORTWARNING
!define MUI_HEADER_TRANSPARENT_TEXT
!define MUI_BGCOLOR "09131F"
!define MUI_TEXTCOLOR "F4FBFF"
!define MUI_INSTFILESPAGE_COLORS "D6ECFF 0E1724"

!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend
