@ECHO off

:: Figure out the best way to invoke node and npm
IF EXIST "%~dp0"\"node.exe" SET NODE="%~dp0"\"node.exe" ELSE SET NODE=node
SET NPM="%~dp0\.\node_modules\npm\bin\npm-cli.js"

:: Initial invokation, forwarding parameters
CMD /C %NODE% %NPM% %*

:: Exit if this script was invoked with parameters
IF !%1==! GOTO INTERACTIVE ELSE GOTO :EOF

:: Go into command loop if given no params
:INTERACTIVE
ECHO.
ECHO.
ECHO # Enter [Q] to quit #
ECHO.

:LOOP
:: Clear and then get next command
SET COMMAND=
SET /P COMMAND="npm> "

:: Exit on "q"
IF "%COMMAND%"=="q" GOTO :EOF

:: Run npm with given command
ECHO.
CMD /C %NODE% %NPM% %COMMAND%
ECHO.
GOTO LOOP
