# Source
# https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html-single/installation_configuration/index

Installation configuration | OpenShift Container Platform | 4.20 | Red Hat Documentation

# Installation configuration

---

OpenShift Container Platform 4.20

## Cluster-wide configuration during installations

Red Hat OpenShift Documentation Team

Legal Notice

Abstract

This document describes how to perform initial OpenShift Container Platform cluster configuration.

---

## Chapter 1. Customizing nodesCopy link

OpenShift Container Platform supports both cluster-wide and per-machine configuration via Ignition, which allows arbitrary partitioning and file content changes to the operating system. In general, if a configuration file is documented in Red Hat Enterprise Linux (RHEL), then modifying it via Ignition is supported.

There are two ways to deploy machine config changes:

- Creating machine configs that are passed to running OpenShift Container Platform nodes via the Machine Config Operator.
- Creating machine configs that are included in manifest files to start up a cluster during`openshift-install`.

Additionally, modifying the reference config, such as the Ignition config that is passed to`coreos-installer` when installing bare-metal nodes allows per-machine configuration. These changes are currently not visible to the Machine Config Operator.

The following sections describe features that you might want to configure on your nodes in this way.

### 1.1. Creating machine configs with ButaneCopy link

Machine configs are used to configure control plane and worker machines by instructing machines how to create users and file systems, set up the network, install systemd units, and more.

Because modifying machine configs can be difficult, you can use Butane configs to create machine configs for you, thereby making node configuration much easier.

#### 1.1.1. About ButaneCopy link

Butane is a command-line utility that OpenShift Container Platform uses to provide convenient, short-hand syntax for writing machine configs, as well as for performing additional validation of machine configs. The format of the Butane config file that Butane accepts is defined in the [OpenShift Butane config spec](https://coreos.github.io/butane/specs/).

#### 1.1.2. Installing ButaneCopy link

You can install the Butane tool (`butane`) to create OpenShift Container Platform machine configs from a command-line interface. You can install`butane` on Linux, Windows, or macOS by downloading the corresponding binary file.

Tip

Butane releases are backwards-compatible with older releases and with the Fedora CoreOS Config Transpiler (FCCT).

Procedure

Get the`butane` binary:

For the newest version of Butane, save the latest`butane` image to your current directory:

```shell-session
$ curl https://mirror.openshift.com/pub/openshift-v4/clients/butane/latest/butane --output butane
```

Copy to Clipboard Toggle word wrap

Optional: For a specific type of architecture you are installing Butane on, such as aarch64 or ppc64le, indicate the appropriate URL. For example:

```shell-session
$ curl https://mirror.openshift.com/pub/openshift-v4/clients/butane/latest/butane-aarch64 --output butane
```

Copy to Clipboard Toggle word wrap

Make the downloaded binary file executable:

```shell-session
$ chmod +x butane
```

Copy to Clipboard Toggle word wrap

Move the`butane` binary file to a directory on your`PATH`.

To check your`PATH`, open a terminal and execute the following command:

```shell-session
$ echo $PATH
```

Copy to Clipboard Toggle word wrap

Verification steps

You can now use the Butane tool by running the`butane` command:

```shell-session
$ butane 
```

Copy to Clipboard Toggle word wrap

#### 1.1.3. Creating a MachineConfig object by using ButaneCopy link

You can use Butane to produce a`MachineConfig` object so that you can configure worker or control plane nodes at installation time or via the Machine Config Operator.

Prerequisites

- You have installed the`butane` utility.

Procedure

Create a Butane config file. The following example creates a file named`99-worker-custom.bu` that configures the system console to show kernel debug messages and specifies custom settings for the chrony time service:

```yaml
variant: openshift
version: 4.20.0
metadata:
 name: 99-worker-custom
 labels:
 machineconfiguration.openshift.io/role: worker
openshift:
 kernel_arguments:
 - loglevel=7
storage:
 files:
 - path: /etc/chrony.conf
 mode: 0644
 overwrite: true
 contents:
 inline: |
 pool 0.rhel.pool.ntp.org iburst
 driftfile /var/lib/chrony/drift
 makestep 1.0 3
 rtcsync
 logdir /var/log/chrony
```

Copy to Clipboard Toggle word wrap

Note

The`99-worker-custom.bu` file is set to create a machine config for worker nodes. To deploy on control plane nodes, change the role from`worker` to`master`. To do both, you could repeat the whole procedure using different file names for the two types of deployments.

Create a`MachineConfig` object by giving Butane the file that you created in the previous step:

```shell-session
$ butane 99-worker-custom.bu -o ./99-worker-custom.yaml
```

Copy to Clipboard Toggle word wrap

A`MachineConfig` object YAML file is created for you to finish configuring your machines.

If the cluster is not running yet, generate manifest files and add the`MachineConfig` object YAML file to the`openshift` directory. If the cluster is already running, apply the file as follows:

```shell-session
$ oc create -f 99-worker-custom.yaml
```

Copy to Clipboard Toggle word wrap

1. Save the Butane config in case you need to update the`MachineConfig` object in the future.

...[Content truncated]
