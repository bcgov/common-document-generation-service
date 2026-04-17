{{/*
Expand the name of the chart.
*/}}
{{- define "carbone.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "carbone.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" $name .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Define the config pattern of the chart based on options.
*/}}
{{- define "carbone.configname" -}}
{{- if .Values.releaseScoped }}
{{- include "carbone.fullname" . }}
{{- else }}
{{- include "carbone.name" . }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "carbone.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "carbone.labels" -}}
helm.sh/chart: {{ include "carbone.chart" . }}
app: {{ include "carbone.fullname" . }}
{{ include "carbone.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/component: app
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: {{ .Release.Name }}
app.openshift.io/runtime: nodejs
{{- end }}

{{/*
Selector labels
*/}}
{{- define "carbone.selectorLabels" -}}
app.kubernetes.io/name: {{ include "carbone.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
