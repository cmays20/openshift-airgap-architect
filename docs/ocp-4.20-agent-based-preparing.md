# Source
# https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/installing_an_on-premise_cluster_with_the_agent-based_installer/preparing-to-install-with-agent-based-installer

Chapter 1. Preparing to install with the Agent-based Installer | Installing an on-premise cluster with the Agent-based Installer | OpenShift Container Platform | 4.20 | Red Hat Documentation

# Chapter 1. Preparing to install with the Agent-based Installer

---

## 1.1. About the Agent-based InstallerCopy link

The Agent-based installation method provides the flexibility to boot your on-premise servers in any way that you choose. It combines the ease of use of the Assisted Installation service with the ability to run offline, including in air-gapped environments. Agent-based installation is a subcommand of the OpenShift Container Platform installer. It generates a bootable ISO image containing all of the information required to deploy an OpenShift Container Platform cluster, with an available release image.

The configuration is in the same format as for the installer-provisioned infrastructure and user-provisioned infrastructure installation methods. The Agent-based Installer can also optionally generate or accept Zero Touch Provisioning (ZTP) custom resources. ZTP allows you to provision new edge sites with declarative configurations of bare-metal equipment.

Expand

`64-bit x86`

✓

✓

`64-bit ARM`

✓

✓

`ppc64le`

✓

✓

`s390x`

✓

✓

| Table 1.1. Agent-based Installer supported architectures | CPU architecture | Connected installation | Disconnected installation |
| --- | --- | --- | --- |

Show more

## 1.2. Understanding Agent-based InstallerCopy link

As an OpenShift Container Platform user, you can leverage the advantages of the Assisted Installer hosted service in disconnected environments.

The Agent-based installation comprises a bootable ISO that contains the Assisted discovery agent and the Assisted Service. Both are required to perform the cluster installation, but the latter runs on only one of the hosts.

Note

Currently, ISO boot support on IBM Z® (`s390x`) is available only for Red Hat Enterprise Linux (RHEL) KVM, which provides the flexibility to choose either PXE or ISO-based installation. For installations with z/VM and Logical Partition (LPAR), only PXE boot is supported.

The`openshift-install agent create image` subcommand generates an ephemeral ISO based on the inputs that you provide. You can choose to provide inputs through the following manifests:

Preferred:

- `agent-config.yaml`
- `install-config.yaml`

Optional: ZTP manifests

- `mirror/ca-bundle.crt`
- `mirror/registries.conf`
- `cluster-manifests/nmstateconfig.yaml`
- `cluster-manifests/cluster-image-set.yaml`
- `cluster-manifests/infraenv.yaml`
- `cluster-manifests/pull-secret.yaml`
- `cluster-manifests/agent-cluster-install.yaml`
- `cluster-manifests/cluster-deployment.yaml`

### 1.2.1. Agent-based Installer workflowCopy link

One of the control plane hosts runs the Assisted Service at the start of the boot process and eventually becomes the bootstrap host. This node is called the rendezvous host (node 0). The Assisted Service ensures that all the hosts meet the requirements and triggers an OpenShift Container Platform cluster deployment. All the nodes have the Red Hat Enterprise Linux CoreOS (RHCOS) image written to the disk. The non-bootstrap nodes reboot and initiate a cluster deployment. Once the nodes are rebooted, the rendezvous host reboots and joins the cluster. The bootstrapping is complete and the cluster is deployed.

Figure 1.1. Node installation workflow

[View larger image](https://access.redhat.com/webassets/avalon/d/OpenShift_Container_Platform-4.20-Installing_an_on-premise_cluster_with_the_Agent-based_Installer-en-US/images/29ccc02b7fddfa90caec07c9f7e20421/agent-based-installer-workflow.png)

You can install a disconnected OpenShift Container Platform cluster through the`openshift-install agent create image` subcommand for the following topologies:

- Highly available OpenShift Container Platform cluster (HA): Three master nodes with any number of worker nodes.
- A three-node OpenShift Container Platform cluster : A compact cluster that has three master nodes that are also worker nodes.
- A single-node OpenShift Container Platform cluster (SNO): A node that is both a master and worker.

### 1.2.2. Recommended resources for topologiesCopy link

Recommended cluster resources for the following topologies:

Expand

Single-node cluster

1

0

8 vCPUs

16 GB of RAM

120 GB

Compact cluster

3

0 or 1

8 vCPUs

16 GB of RAM

120 GB

HA cluster

3 to 5

2 and above

8 vCPUs

16 GB of RAM

120 GB

| Table 1.2. Recommended cluster resources | Topology | Number of control plane nodes | Number of compute nodes | vCPU | Memory | Storage |
| --- | --- | --- | --- | --- | --- | --- |

Show more

In the`install-config.yaml`, specify the platform on which to perform the installation. The following platforms are supported:

`none`

Important

For platform`none`:

- Review the information in the [guidelines for deploying OpenShift Container Platform on non-tested platforms](https://access.redhat.com/articles/4207611) before you attempt to install an OpenShift Container Platform cluster in virtualized or cloud environments.
- The`none` option requires the provision of DNS name resolution and load balancing infrastructure in your cluster. See Requirements for a cluster using the platform "none" option in the "Additional resources" section for more information.

Note

For installations on IBM Z® (`s390x`) architecture, the minimum memory requirement is 24 GB RAM per host instead of 16 GB.

## 1.3. About FIPS complianceCopy link

For many OpenShift Container Platform customers, regulatory readiness, or compliance, on some level is required before any systems can be put into production. That regulatory readiness can be imposed by national standards, industry standards or the organization’s corporate governance framework. Federal Information Processing Standards (FIPS) compliance is one of the most critical components required in highly secure environments to ensure that only supported cryptographic technologies are allowed on nodes.

Important

To enable FIPS mode for your cluster, you must run the installation program from a Red Hat Enterprise Linux (RHEL) computer configured to operate in FIPS mode. For more information about configuring FIPS mode on RHEL, see [Switching RHEL to FIPS mode](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/security_hardening/switching-rhel-to-fips-mode_security-hardening).

When running Red Hat Enterprise Linux (RHEL) or Red Hat Enterprise Linux CoreOS (RHCOS) booted in FIPS mode, OpenShift Container Platform core components use the RHEL cryptographic libraries that have been submitted to NIST for FIPS 140-2/140-3 Validation on only the x86_64, ppc64le, and s390x architectures.

## 1.4. Configuring FIPS through the Agent-based InstallerCopy link

During a cluster deployment, the Federal Information Processing Standards (FIPS) change is applied when the Red Hat Enterprise Linux CoreOS (RHCOS) machines are deployed in your cluster. For Red Hat Enterprise Linux (RHEL) machines, you must enable FIPS mode when you install the operating system on the machines that you plan to use as worker machines.

Important

OpenShift Container Platform requires the use of a FIPS-capable installation binary to install a cluster in FIPS mode.

You can enable FIPS mode through the preferred method of`install-config.yaml` and`agent-config.yaml`:

You must set value of the`fips` field to`true` in the`install-config.yaml` file:

Sample install-config.yaml.file

```yaml
apiVersion: v1
baseDomain: test.example.com
metadata:
 name: sno-cluster
fips: true
```

Copy to Clipboard Toggle word wrap

Important

To enable FIPS mode on IBM Z® clusters, you must also enable FIPS in either the`.parm` file or using`virt-install` as outlined in the procedures for manually adding IBM Z® agents.

Optional: If you are using the GitOps ZTP manifests, you must set the value of`fips` as`true` in the`agent-install.openshift.io/install-config-overrides` field in the`agent-cluster-install.yaml` file:

Sample agent-cluster-install.yaml file

```yaml
apiVersion: extensions.hive.openshift.io/v1beta1
kind: AgentClusterInstall
metadata:
 annotations:
 agent-install.openshift.io/install-config-overrides: '{"fips": true}'
 name: sno-cluster
 namespace: sno-cluster-test
```

Copy to Clipboard Toggle word wrap

## 1.5. Host configurationCopy link

You can make additional configurations for each host on the cluster in the`agent-config.yaml` file, such as network configurations and root device hints.

Important

For each host you configure, you must provide the MAC address of an interface on the host to specify which host you are configuring.

### 1.5.1. Host rolesCopy link

Each host in the cluster is assigned a role of either`master` or`worker`. You can define the role for each host in the`agent-config.yaml` file by using the`role` parameter. If you do not assign a role to the hosts, the roles will be assigned at random during installation.

It is recommended to explicitly define roles for your hosts.

The`rendezvousIP` must be assigned to a host with the`master` role. This can be done manually or by allowing the Agent-based Installer to assign the role.

Important

You do not need to explicitly define the`master` role for the rendezvous host, however you cannot create configurations that conflict with this assignment.

For example, if you have 4 hosts with 3 of the hosts explicitly defined to have the`master` role, the last host that is automatically assigned the`worker` role during installation cannot be configured as the rendezvous host.

Sample agent-config.yaml file

```yaml
apiVersion: v1beta1
kind: AgentConfig
metadata:
 name: example-cluster
rendezvousIP: 192.168.111.80
hosts:
 - hostname: master-1
 role: master
 interfaces:
 - name: eno1
 macAddress: 00:ef:44:21:e6:a5
 - hostname: master-2
 role: master
 interfaces:
 - name: eno1
 macAddress: 00:ef:44:21:e6:a6
 - hostname: master-3
 role: master
 interfaces:
 - name: eno1
 macAddress: 00:ef:44:21:e6:a7
 - hostname: worker-1
 role: worker
 interfaces:
 - name: eno1
 macAddress: 00:ef:44:21:e6:a8
```

Copy to Clipboard Toggle word wrap

### 1.5.2. About root device hintsCopy link

The`rootDeviceHints` parameter enables the installer to provision the Red Hat Enterprise Linux CoreOS (RHCOS) image to a particular device. The installer examines the devices in the order it discovers them, and compares the discovered values with the hint values. The installer uses the first discovered device that matches the hint value. The configuration can combine multiple hints, but a device must match all hints for the installer to select it.

Expand

`deviceName`

A string containing a Linux device name such as`/dev/vda` or`/dev/disk/by-path/`.

Note

It is recommended to use the`/dev/disk/by-path/ ` link to the storage location.

The hint must match the actual value exactly.

`hctl`

A string containing a SCSI bus address like`0:0:0:0`. The hint must match the actual value exactly.

`model`

A string containing a vendor-specific device identifier. The hint can be a substring of the actual value.

`vendor`

A string containing the name of the vendor or manufacturer of the device. The hint can be a sub-string of the actual value.

`serialNumber`

A string containing the device serial number. The hint must match the actual value exactly.

`minSizeGigabytes`

An integer representing the minimum size of the device in gigabytes.

`wwn`

A string containing the unique storage identifier. The hint must match the actual value exactly. If you use the`udevadm` command to retrieve the`wwn` value, and the command outputs a value for`ID_WWN_WITH_EXTENSION`, then you must use this value to specify the`wwn` subfield.

`rotational`

A boolean indicating whether the device should be a rotating disk (true) or not (false).

| Table 1.3. Subfields | Subfield | Description |
| --- | --- | --- |

Show more

Example usage

```yaml
 - name: master-0
 role: master
 rootDeviceHints:
 deviceName: "/dev/sda"
```

Copy to Clipboard Toggle word wrap

## 1.6. About networkingCopy link

The rendezvous IP must be known at the time of generating the agent ISO, so that during the initial boot all the hosts can check in to the assisted service. If the IP addresses are assigned using a Dynamic Host Configuration Protocol (DHCP) server, then the`rendezvousIP` field must be set to an IP address of one of the hosts that will become part of the deployed control plane. In an environment without a DHCP server, you can define IP addresses statically.

In addition to static IP addresses, you can apply any network configuration that is in NMState format. This includes VLANs and NIC bonds.

Note

By default, Podman uses a subnet of`10.88.0.0/16` as a bridge network. Do not set the`network.machineNetwork.cidr` parameter to include this address range, otherwise a conflict causes the cluster installation to fail.

### 1.6.1. DHCPCopy link

Preferred method:`install-config.yaml` and`agent-config.yaml`

You must specify the value for the`rendezvousIP` field. The`networkConfig` fields can be left blank:

Sample agent-config.yaml.file

```yaml
apiVersion: v1alpha1
kind: AgentConfig
metadata:
 name: sno-cluster
rendezvousIP: 192.168.111.80 
```

1

Copy to Clipboard Toggle word wrap

1

The IP address for the rendezvous host.

### 1.6.2. Static networkingCopy link

Preferred method:`install-config.yaml` and`agent-config.yaml`

Sample agent-config.yaml.file

```yaml
cat > agent-config.yaml << EOF
apiVersion: v1alpha1
kind: AgentConfig
metadata:
 name: sno-cluster
rendezvousIP: 192.168.111.80 
```

1

```yaml

hosts:
 - hostname: master-0
 interfaces:
 - name: eno1
 macAddress: 00:ef:44:21:e6:a5 
```

2

```yaml

 networkConfig:
 interfaces:
 - name: eno1
 type: ethernet
 state: up
 mac-address: 00:ef:44:21:e6:a5
 ipv4:
 enabled: true
 address:
 - ip: 192.168.111.80 
```

3

```yaml

 prefix-length: 23 
```

4

```yaml

 dhcp: false
 dns-resolver:
 config:
 server:
 - 192.168.111.1 
```

5

```yaml

 routes:
 config:
 - destination: 0.0.0.0/0
 next-hop-address: 192.168.111.1 
```

6

```yaml

 next-hop-interface: eno1
 table-id: 254
EOF
```

Copy to Clipboard Toggle word wrap

1

If a value is not specified for the`rendezvousIP` field, one address will be chosen from the static IP addresses specified in the`networkConfig` fields.

2

The MAC address of an interface on the host, used to determine which host to apply the configuration to.

3

The static IP address of the target bare metal host.

4

The static IP address’s subnet prefix for the target bare metal host.

5

The DNS server for the target bare metal host.

6

Next hop address for the node traffic. This must be in the same subnet as the IP address set for the specified interface.

Optional method: GitOps ZTP manifests

The optional method of the GitOps ZTP custom resources comprises 6 custom resources; you can configure static IPs in the`nmstateconfig.yaml` file.

```yaml
apiVersion: agent-install.openshift.io/v1beta1
kind: NMStateConfig
metadata:
 name: master-0
 namespace: openshift-machine-api
 labels:
 cluster0-nmstate-label-name: cluster0-nmstate-label-value
spec:
 config:
 interfaces:
 - name: eth0
 type: ethernet
 state: up
 mac-address: 52:54:01:aa:aa:a1
 ipv4:
 enabled: true
 address:
 - ip: 192.168.122.2 
```

1

```yaml

 prefix-length: 23 
```

2

```yaml

 dhcp: false
 dns-resolver:
 config:
 server:
 - 192.168.122.1 
```

3

```yaml

 routes:
 config:
 - destination: 0.0.0.0/0
 next-hop-address: 192.168.122.1 
```

4

```yaml

 next-hop-interface: eth0
 table-id: 254
 interfaces:
 - name: eth0
 macAddress: 52:54:01:aa:aa:a1 
```

5

Copy to Clipboard Toggle word wrap

1

The static IP address of the target bare metal host.

2

The static IP address’s subnet prefix for the target bare metal host.

3

The DNS server for the target bare metal host.

4

Next hop address for the node traffic. This must be in the same subnet as the IP address set for the specified interface.

5

The MAC address of an interface on the host, used to determine which host to apply the configuration to.

The rendezvous IP is chosen from the static IP addresses specified in the`config` fields.

...[Content truncated]
