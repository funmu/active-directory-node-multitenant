# -----------------------------------------------------------------------------
#  AuthenticatedCaller.ps1 
#   o  Sample to show how the powershell code can call into Authenciated REST API
#
#   o run it as:
#       powershell -File AuthenticatedCaller.ps1
#
#   This is intended as a sample ONLY!
#
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
#       H E L P E R    F U N C T I O N S
# -----------------------------------------------------------------------------
$env:PSModulePath += (";" + $pwd + "\Modules")
$env:PSModulePath


function Load-ActiveDirectoryAuthenticationLibrary()
{
  Write-Host "Start download and installation of Active Directory Authentication Library (ADAL)... "

  $moduleDirPath = [Environment]::GetFolderPath("MyDocuments") + "\WindowsPowerShell\Modules"
  $modulePath = $moduleDirPath + "\AADGraph"
  if(-not (Test-Path ($modulePath+"\Nugets"))) {New-Item -Path ($modulePath+"\Nugets") -ItemType "Directory" | out-null}

  $adalPackageDirectories = (Get-ChildItem -Path ($modulePath+"\Nugets") -Filter "Microsoft.IdentityModel.Clients.ActiveDirectory*" -Directory)

  if($adalPackageDirectories.Length -eq 0) {
    Write-Host " ADAL Nuget doesn't exist. Downloading now ..." -ForegroundColor Yellow
    if(-not(Test-Path ($modulePath + "\Nugets\nuget.exe"))) {

      Write-Host " nuget.exe not found. Downloading from http://www.nuget.org/nuget.exe ..." -ForegroundColor Yellow
      $wc = New-Object System.Net.WebClient
      $wc.DownloadFile("http://www.nuget.org/nuget.exe",$modulePath + "\Nugets\nuget.exe");
    }

    $nugetDownloadExpression = $modulePath + "\Nugets\nuget.exe install Microsoft.IdentityModel.Clients.ActiveDirectory -Version 2.14.201151115 -OutputDirectory " + $modulePath + "\Nugets | out-null"
    Invoke-Expression $nugetDownloadExpression
  }

  $adalPackageDirectories = (Get-ChildItem -Path ($modulePath+"\Nugets") -Filter "Microsoft.IdentityModel.Clients.ActiveDirectory*" -Directory)
  $ADAL_Assembly = (Get-ChildItem "Microsoft.IdentityModel.Clients.ActiveDirectory.dll" -Path $adalPackageDirectories[$adalPackageDirectories.length-1].FullName -Recurse)
  $ADAL_WindowsForms_Assembly = (Get-ChildItem "Microsoft.IdentityModel.Clients.ActiveDirectory.WindowsForms.dll" -Path $adalPackageDirectories[$adalPackageDirectories.length-1].FullName -Recurse)

  $loadedADAL = $false;  
  if($ADAL_Assembly.Length -gt 0 -and $ADAL_WindowsForms_Assembly.Length -gt 0) {
    Write-Host " Loading ADAL Assemblies ..."
    Write-Host "   Please login to the pop-up Window with the same admin account credentials" -ForegroundColor Green
    [System.Reflection.Assembly]::LoadFrom($ADAL_Assembly[0].FullName) | out-null
    [System.Reflection.Assembly]::LoadFrom($ADAL_WindowsForms_Assembly.FullName) | out-null
    Write-Host "Loaded ADAL library successfully"
    $loadedADAL = $true;
  } else {
    Write-Host " Fixing Active Directory Authentication Library package directories ..." -ForegroundColor Yellow
    $adalPackageDirectories | Remove-Item -Recurse -Force | Out-Null
    Write-Host " Not able to load ADAL assembly. Delete the Nugets folder under" $modulePath ", restart PowerShell session and try again ..."
  }

  return $loadedADAL;
}


function Get-TokenResult( $config) 
{
  Write-Host "Getting Access Token for resource: " $config.resourceAppIdUri;

  $authContext = New-Object "Microsoft.IdentityModel.Clients.ActiveDirectory.AuthenticationContext" -ArgumentList $config.authority,$false
  $authResult = $authContext.AcquireToken( $config.resourceAppIdURI, $config.clientID, $config.redirectUri, [Microsoft.IdentityModel.Clients.ActiveDirectory.PromptBehavior]::Always)
  
  Write-Host " ... obtained Access Token of type: " $authResult.AccessTokenType;
  return $authResult
}

Function Invoke-AuthenticatedCallAndPrint( $uriToGet, $method, $token) 
{

    $authHeader = $token.AccessTokenType + " " + $token.AccessToken; 

    $params = @{ uri = $uriToGet; # API location
                Method = $method;
                Headers = @{"Authorization"=$authHeader;};
        }; # end $params hash table

    Write-Host
    Write-Host "---------------------------------------------------------"
    Write-Host " Invoking REST Method " $method " at URI: " $uriToGet
    $var = Invoke-RestMethod @params

    Write-Host "   .... completed the Authenticated Call." 
    $resultsInJson = $var | ConvertTo-Json;
    Write-Host $resultsInJson;
    Write-Host
}

# -----------------------------------------------------------------------------
#       C A L L    F L O W
# -----------------------------------------------------------------------------

# 1. Load the configuration file
$configForCaller = $env:configForCaller
if ($configForCaller -eq $null) { 
    # use the default
    $configForCaller = "config.json"
}

$config = (Get-Content $configForCaller | ConvertFrom-Json)

# 2.  load up the ADAL libraries
Load-ActiveDirectoryAuthenticationLibrary

# 3. Get security access token
$token = Get-TokenResult $config

# 4. Make method calls and get results
# call a sequence of methods to check out how the authenticated calls work out

Write-Host "1. Get the set of methods at the root"
Invoke-AuthenticatedCallAndPrint "http://localhost:8888/"  'GET' $token

Write-Host "2. Get all the tasks"
Invoke-AuthenticatedCallAndPrint "http://localhost:8888/tasks"  'GET' $token

Write-Host "3. Post a new task"
Invoke-AuthenticatedCallAndPrint "http://localhost:8888/tasks/murali/TestSamples1"  'POST' $token

Write-Host "4. Post another task"
Invoke-AuthenticatedCallAndPrint "http://localhost:8888/tasks/murali/TestSamples2"  'POST' $token

Write-Host "5. Get all the tasks"
Invoke-AuthenticatedCallAndPrint "http://localhost:8888/tasks"  'GET' $token
