!include "MUI2.nsh"

Var Dialog
Var PasswordInput
Var Status

Page custom nsDialogsPage nsDialogsPageLeave

Function nsDialogsPage
  nsDialogs::Create 1018
  Pop $Dialog

  ${If} $Dialog == error
    Abort
  ${EndIf}

  !insertmacro MUI_HEADER_TEXT "Password Protection" "Please enter the password to install."

  ${NSD_CreateLabel} 0 0 100% 12u "Password:"
  Pop $0

  ${NSD_CreatePassword} 13% 13u 75% 12u ""
  Pop $PasswordInput

  nsDialogs::Show
FunctionEnd

Function nsDialogsPageLeave
  ${NSD_GetText} $PasswordInput $R0
  # "Saitama47" er jaygay apnar deya password-ti boshan
  ${If} $R0 == "Saitama47"
    StrCpy $Status "success"
  ${Else}
    MessageBox MB_OK|MB_ICONSTOP "Incorrect password. Installation will be aborted."
    Abort
  ${EndIf}
FunctionEnd