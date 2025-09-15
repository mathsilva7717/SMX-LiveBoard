; Script personalizado do instalador NSIS para SMX LiveBoard

; Configurações do instalador (usando variáveis já definidas pelo Electron Builder)
; !define PRODUCT_NAME "SMX LiveBoard"  ; Já definido pelo Electron Builder
; !define PRODUCT_VERSION "1.0.0"       ; Já definido pelo Electron Builder
!define PRODUCT_PUBLISHER "SMX Team"
!define PRODUCT_WEB_SITE "https://github.com/smx/liveboard"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\SMX LiveBoard.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

; Configurações visuais
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "banner.bmp"
!define MUI_HEADERIMAGE_UNBITMAP "banner.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "banner.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "banner.bmp"

; Páginas do instalador
!define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao ${PRODUCT_NAME}"
!define MUI_WELCOMEPAGE_TEXT "Este assistente irá guiá-lo através da instalação do ${PRODUCT_NAME} v${PRODUCT_VERSION}.$\r$\n$\r$\n${PRODUCT_NAME} é um dashboard de monitoramento de sistema em tempo real.$\r$\n$\r$\nClique em Avançar para continuar."

!define MUI_FINISHPAGE_TITLE "Instalação Concluída"
!define MUI_FINISHPAGE_TEXT "O ${PRODUCT_NAME} foi instalado com sucesso em seu computador.$\r$\n$\r$\nClique em Finalizar para fechar este assistente."

; Configurações de instalação
!define MUI_DIRECTORYPAGE_TEXT_TOP "O assistente instalará o ${PRODUCT_NAME} na pasta a seguir.$\r$\n$\r$\nPara instalar em uma pasta diferente, clique em Procurar e selecione outra pasta.$\r$\n$\r$\nClique em Avançar para continuar."

; Configurações de desinstalação
!define MUI_UNCONFIRMPAGE_TEXT_TOP "O ${PRODUCT_NAME} será removido do seu computador.$\r$\n$\r$\nClique em Desinstalar para continuar ou em Cancelar para sair."

; Função para verificar se o aplicativo está rodando
Function CheckAppRunning
  FindWindow $0 "" "${PRODUCT_NAME}"
  IntCmp $0 0 notRunning
    MessageBox MB_OK|MB_ICONEXCLAMATION "O ${PRODUCT_NAME} está rodando. Por favor, feche o aplicativo antes de continuar a instalação."
    Abort
  notRunning:
FunctionEnd

; Função para verificar requisitos do sistema
Function CheckSystemRequirements
  ; Verificar se é Windows 10 ou superior
  ${If} ${AtLeastWin10}
    ; OK
  ${Else}
    MessageBox MB_OK|MB_ICONSTOP "Este aplicativo requer Windows 10 ou superior."
    Abort
  ${EndIf}
FunctionEnd

; Função executada antes da instalação
Function .onInit
  Call CheckSystemRequirements
  Call CheckAppRunning
FunctionEnd

; Função executada após a instalação
Function .onInstSuccess
  ; Criar entrada no registro para desinstalação
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\${PRODUCT_NAME}.exe"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr HKLM "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "NoRepair" 1
FunctionEnd
