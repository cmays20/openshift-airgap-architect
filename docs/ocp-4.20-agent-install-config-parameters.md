# Source
# https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/installing_an_on-premise_cluster_with_the_agent-based_installer/installation-config-parameters-agent

Chapter 9. Installation configuration parameters for the Agent-based Installer | Installing an on-premise cluster with the Agent-based Installer | OpenShift Container Platform | 4.20 | Red Hat Documentation

# Chapter 9. Installation configuration parameters for the Agent-based Installer

---

Before you deploy an OpenShift Container Platform cluster using the Agent-based Installer, you provide parameters to customize your cluster and the platform that hosts it. When you create the`install-config.yaml` and`agent-config.yaml` files, you must provide values for the required parameters, and you can use the optional parameters to customize your cluster further.

## 9.1. Available installation configuration parametersCopy link

The following tables specify the required and optional installation configuration parameters that you can set as part of the Agent-based installation process.

These values are specified in the`install-config.yaml` file.

Important

These settings are used for installation only, and cannot be changed after installation.

### 9.1.1. Required configuration parametersCopy link

Required installation configuration parameters are described in the following table:

Expand

```plaintext
apiVersion:
```

Copy to Clipboard Toggle word wrap

The API version for the`install-config.yaml` content. The current version is`v1`. The installation program might also support older API versions.

Value: String

```plaintext
baseDomain:
```

Copy to Clipboard Toggle word wrap

The base domain of your cloud provider. The base domain is used to create routes to your OpenShift Container Platform cluster components. The full DNS name for your cluster is a combination of the`baseDomain` and`metadata.name` parameter values that uses the`. ` format.

Value: A fully-qualified domain or subdomain name, such as`example.com`.

```plaintext
metadata:
```

Copy to Clipboard Toggle word wrap

Kubernetes resource`ObjectMeta`, from which only the`name` parameter is consumed.

Value: Object

```plaintext
metadata:
 name:
```

Copy to Clipboard Toggle word wrap

The name of the cluster. DNS records for the cluster are all subdomains of`{{.metadata.name}}.{{.baseDomain}}`. The cluster name is set to`agent-cluster` when you do not provide the`metadata.name` parameter through either the`install-config.yaml` or`agent-config.yaml` files. For example, installations that only use ZTP manifests do not provide the`metadata.name` parameter.

Value: String of lowercase letters, hyphens (`-`), and periods (`.`), such as`dev`.

```plaintext
platform:
```

Copy to Clipboard Toggle word wrap

The configuration for the specific platform upon which to perform the installation:`baremetal`,`external`,`none`,`vsphere`, or`nutanix`.

Value: Object

```plaintext
pullSecret:
```

Copy to Clipboard Toggle word wrap

Get a [pull secret from Red Hat OpenShift Cluster Manager](https://console.redhat.com/openshift/install/pull-secret) to authenticate downloading container images for OpenShift Container Platform components from services such as Quay.io.

Value:

```plaintext
{
 "auths":{
 "cloud.openshift.com":{
 "auth":"b3Blb=",
 "email":"you@example.com"
 },
 "quay.io":{
 "auth":"b3Blb=",
 "email":"you@example.com"
 }
 }
}
```

Copy to Clipboard Toggle word wrap

| Table 9.1. Required parameters | Parameter | Description |
| --- | --- | --- |

Show more

### 9.1.2. Network configuration parametersCopy link

You can customize your installation configuration based on the requirements of your existing network infrastructure. For example, you can expand the IP address block for the cluster network or configure different IP address blocks than the defaults.

Consider the following information before you configure network parameters for your cluster:

If you deployed nodes in an OpenShift Container Platform cluster with a network that supports both IPv4 and non-link-local IPv6 addresses, configure your cluster to use a dual-stack network.

- To prevent network connectivity issues, do not install a single-stack IPv4 cluster on a host that supports dual-stack networking.
- For clusters configured for dual-stack networking, both IPv4 and IPv6 traffic must use the same network interface as the default gateway. This ensures that in a multiple network interface controller (NIC) environment, a cluster can detect what NIC to use based on the available network interface. For more information, see "OVN-Kubernetes IPv6 and dual-stack limitations" in About the OVN-Kubernetes network plugin.

If you configure your cluster to use both IP address families, review the following requirements:

You must specify IPv4 and IPv6 addresses in the same order for all network configuration parameters. For example, in the following configuration, IPv4 addresses are listed before IPv6 addresses:

```yaml
networking:
 clusterNetwork:
 - cidr: 10.128.0.0/14
 hostPrefix: 23
 - cidr: fd00:10:128::/56
 hostPrefix: 64
 serviceNetwork:
 - 172.30.0.0/16
 - fd00:172:16::/112
```

Copy to Clipboard Toggle word wrap

- Both IP families must have the default gateway.
- Both IP families must use the same network interface for the default gateway.

Expand

```plaintext
networking:
```

Copy to Clipboard Toggle word wrap

The configuration for the cluster network.

Value: Object

Note

You cannot change parameters specified by the`networking` object after installation.

```plaintext
networking:
 networkType:
```

Copy to Clipboard Toggle word wrap

The Red Hat OpenShift Networking network plugin to install.

Value:`OVNKubernetes`.`OVNKubernetes` is a Container Network Interface (CNI) plugin for Linux networks and hybrid networks that contain both Linux and Windows servers. The default value is`OVNKubernetes`.

```plaintext
networking:
 clusterNetwork:
```

Copy to Clipboard Toggle word wrap

The IP address blocks for pods.

The default value is`10.128.0.0/14` with a host prefix of`/23`.

If you specify multiple IP address blocks, the blocks must not overlap.

Value: An array of objects. For example:

```yaml
networking:
 clusterNetwork:
 - cidr: 10.128.0.0/14
 hostPrefix: 23
 - cidr: fd01::/48
 hostPrefix: 64
```

Copy to Clipboard Toggle word wrap

```plaintext
networking:
 clusterNetwork:
 cidr:
```

Copy to Clipboard Toggle word wrap

Required if you use`networking.clusterNetwork`. An IP address block.

If you use the OVN-Kubernetes network plugin, you can specify IPv4 and IPv6 networks.

Value: An IP address block in Classless Inter-Domain Routing (CIDR) notation. The prefix length for an IPv4 block is between`0` and`32`. The prefix length for an IPv6 block is between`0` and`128`. For example,`10.128.0.0/14` or`fd01::/48`.

```plaintext
networking:
 clusterNetwork:
 hostPrefix:
```

Copy to Clipboard Toggle word wrap

The subnet prefix length to assign to each individual node. For example, if`hostPrefix` is set to`23` then each node is assigned a`/23` subnet out of the given`cidr`. A`hostPrefix` value of`23` provides 510 (2^(32 - 23) - 2) pod IP addresses.

Value: A subnet prefix.

For an IPv4 network the default value is`23`. For an IPv6 network the default value is`64`. The default value is also the minimum value for IPv6.

```plaintext
networking:
 serviceNetwork:
```

Copy to Clipboard Toggle word wrap

The IP address block for services. The default value is`172.30.0.0/16`.

The OVN-Kubernetes network plugins supports only a single IP address block for the service network.

If you use the OVN-Kubernetes network plugin, you can specify an IP address block for both of the IPv4 and IPv6 address families.

Value: An array with an IP address block in CIDR format. For example:

```yaml
networking:
 serviceNetwork:
 - 172.30.0.0/16
 - fd02::/112
```

Copy to Clipboard Toggle word wrap

```plaintext
networking:
 machineNetwork:
```

Copy to Clipboard Toggle word wrap

The IP address blocks for machines.

If you specify multiple IP address blocks, the blocks must not overlap.

Value: An array of objects. For example:

```yaml
networking:
 machineNetwork:
 - cidr: 10.0.0.0/16
```

Copy to Clipboard Toggle word wrap

```plaintext
networking:
 machineNetwork:
 cidr:
```

Copy to Clipboard Toggle word wrap

Required if you use`networking.machineNetwork`. An IP address block. The default value is`10.0.0.0/16` for all platforms other than libvirt and IBM Power® Virtual Server. For libvirt, the default value is`192.168.126.0/24`. For IBM Power® Virtual Server, the default value is`192.168.0.0/24`.

Value: An IP network block in CIDR notation.

For example,`10.0.0.0/16` or`fd00::/48`.

Note

Set the`networking.machineNetwork` to match the CIDR that the preferred NIC resides in.

```plaintext
networking:
 ovnKubernetesConfig:
 ipv4:
 internalJoinSubnet:
```

Copy to Clipboard Toggle word wrap

Configures the IPv4 join subnet that is used internally by`ovn-kubernetes`. This subnet must not overlap with any other subnet that OpenShift Container Platform is using, including the node network. The size of the subnet must be larger than the number of nodes. You cannot change the value after installation.

Value: An IP network block in CIDR notation. The default value is`100.64.0.0/16`.

| Table 9.2. Network parameters | Parameter | Description |
| --- | --- | --- |

Show more

### 9.1.3. Optional configuration parametersCopy link

Optional installation configuration parameters are described in the following table:

Expand

```plaintext
additionalTrustBundle:
```

Copy to Clipboard Toggle word wrap

A PEM-encoded X.509 certificate bundle that is added to the nodes' trusted certificate store. This trust bundle might also be used when a proxy has been configured.

Value: String

```plaintext
capabilities:
```

Copy to Clipboard Toggle word wrap

Controls the installation of optional core cluster components. You can reduce the footprint of your OpenShift Container Platform cluster by disabling optional components. For more information, see the "Cluster capabilities" page in Installing.

Value: String array

```plaintext
capabilities:
 baselineCapabilitySet:
```

Copy to Clipboard Toggle word wrap

Selects an initial set of optional capabilities to enable. Valid values are`None`,`v4.11`,`v4.12` and`vCurrent`. The default value is`vCurrent`.

Value: String

```plaintext
capabilities:
 additionalEnabledCapabilities:
```

Copy to Clipboard Toggle word wrap

Extends the set of optional capabilities beyond what you specify in`baselineCapabilitySet`. You can specify multiple capabilities in this parameter.

Value: String array

```plaintext
cpuPartitioningMode:
```

Copy to Clipboard Toggle word wrap

Enables workload partitioning, which isolates OpenShift Container Platform services, cluster management workloads, and infrastructure pods to run on a reserved set of CPUs. You can only enable workload partitioning during installation. You cannot disable it after installation. While this field enables workload partitioning, it does not configure workloads to use specific CPUs. For more information, see the Workload partitioning page in the Scalability and Performance section.

Value:`None` or`AllNodes`.`None` is the default value.

```plaintext
compute:
```

Copy to Clipboard Toggle word wrap

The configuration for the machines that comprise the compute nodes.

Value: Array of`MachinePool` objects.

```plaintext
compute:
 architecture:
```

Copy to Clipboard Toggle word wrap

Determines the instruction set architecture of the machines in the pool. Currently, clusters with varied architectures are not supported. All pools must specify the same architecture. Valid values are`amd64`,`arm64`,`ppc64le`, and`s390x`.

Value: String

```plaintext
compute:
 hyperthreading:
```

Copy to Clipboard Toggle word wrap

Whether to enable or disable simultaneous multithreading, or`hyperthreading`, on compute machines. By default, simultaneous multithreading is enabled to increase the performance of your machines' cores.

Important

If you disable simultaneous multithreading, ensure that your capacity planning accounts for the dramatically decreased machine performance.

Value:`Enabled` or`Disabled`

```plaintext
compute:
 name:
```

Copy to Clipboard Toggle word wrap

Required if you use`compute`. The name of the machine pool.

Value:`worker`

```plaintext
compute:
 platform:
```

Copy to Clipboard Toggle word wrap

Required if you use`compute`. Use this parameter to specify the cloud provider to host the worker machines. This parameter value must match the`controlPlane.platform` parameter value.

Value:`baremetal`,`vsphere`, or`{}`

```plaintext
compute:
 replicas:
```

Copy to Clipboard Toggle word wrap

The number of compute machines, which are also known as worker machines, to provision.

Value: A positive integer greater than or equal to`2`. The default value is`3`.

```plaintext
featureSet:
```

Copy to Clipboard Toggle word wrap

Enables the cluster for a feature set. A feature set is a collection of OpenShift Container Platform features that are not enabled by default. For more information about enabling a feature set during installation, see "Enabling features using feature gates".

Value: String. The name of the feature set to enable, such as`TechPreviewNoUpgrade`.

```plaintext
controlPlane:
```

Copy to Clipboard Toggle word wrap

The configuration for the machines that form the control plane.

Value: Array of`MachinePool` objects.

```plaintext
controlPlane:
 architecture:
```

Copy to Clipboard Toggle word wrap

Determines the instruction set architecture of the machines in the pool. Currently, clusters with varied architectures are not supported. All pools must specify the same architecture. Valid values are`amd64`,`arm64`,`ppc64le`, and`s390x`.

Value: String

```plaintext
controlPlane:
 hyperthreading:
```

Copy to Clipboard Toggle word wrap

Whether to enable or disable simultaneous multithreading, or`hyperthreading`, on control plane machines. By default, simultaneous multithreading is enabled to increase the performance of your machines' cores.

Important

If you disable simultaneous multithreading, ensure that your capacity planning accounts for the dramatically decreased machine performance.

Value:`Enabled` or`Disabled`

```plaintext
controlPlane:
 name:
```

Copy to Clipboard Toggle word wrap

Required if you use`controlPlane`. The name of the machine pool.

Value:`master`

```plaintext
controlPlane:
 platform:
```

Copy to Clipboard Toggle word wrap

Required if you use`controlPlane`. Use this parameter to specify the cloud provider that hosts the control plane machines. This parameter value must match the`compute.platform` parameter value.

Value:`baremetal`,`vsphere`, or`{}`

```plaintext
controlPlane:
 replicas:
```

Copy to Clipboard Toggle word wrap

The number of control plane machines to provision.

Value: Supported values are`3`,`4`,`5`, or`1` when deploying single-node OpenShift.

```plaintext
arbiter:
 name: arbiter
```

Copy to Clipboard Toggle word wrap

The OpenShift Container Platform cluster requires a name for arbiter nodes. For example,`arbiter`.

```plaintext
arbiter:
 replicas: 1
```

Copy to Clipboard Toggle word wrap

The`replicas` parameter sets the number of arbiter nodes for the OpenShift Container Platform cluster. You cannot set this field to a value that is greater than 1.

```plaintext
credentialsMode:
```

Copy to Clipboard Toggle word wrap

The Cloud Credential Operator (CCO) mode. If no mode is specified, the CCO dynamically tries to determine the capabilities of the provided credentials, with a preference for mint mode on the platforms where multiple modes are supported.

Note

Not all CCO modes are supported for all cloud providers. For more information about CCO modes, see the "Managing cloud provider credentials" entry in the Authentication and authorization content.

Value:`Mint`,`Passthrough`,`Manual` or an empty string (`""`).

```plaintext
fips:
```

Copy to Clipboard Toggle word wrap

Enable or disable FIPS mode. The default is`false`(disabled). If you enable FIPS mode, the Red Hat Enterprise Linux CoreOS (RHCOS) machines that OpenShift Container Platform runs on bypass the default Kubernetes cryptography suite and use the cryptography modules that RHCOS provides instead.

Important

To enable FIPS mode for your cluster, you must run the installation program from a Red Hat Enterprise Linux (RHEL) computer configured to operate in FIPS mode. For more information about configuring FIPS mode on RHEL, see [Switching RHEL to FIPS mode](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/security_hardening/switching-rhel-to-fips-mode_security-hardening).

When running Red Hat Enterprise Linux (RHEL) or Red Hat Enterprise Linux CoreOS (RHCOS) booted in FIPS mode, OpenShift Container Platform core components use the RHEL cryptographic libraries that have been submitted to NIST for FIPS 140-2/140-3 Validation on only the x86_64, ppc64le, and s390x architectures.

Important

If you are using Azure File storage, you cannot enable FIPS mode.

Value:`false` or`true`

```plaintext
imageContentSources:
```

Copy to Clipboard Toggle word wrap

Sources and repositories for the release-image content.

Value: Array of objects. Includes a`source` and, optionally,`mirrors`, as described in the following rows of this table.

```plaintext
imageContentSources:
 source:
```

Copy to Clipboard Toggle word wrap

Required if you use`imageContentSources`. Specify the repository that users refer to, for example, in image pull specifications.

Value: String

```plaintext
imageContentSources:
 mirrors:
```

Copy to Clipboard Toggle word wrap

Specify one or more repositories that might also contain the same images.

Value: Array of strings

```plaintext
publish:
```

Copy to Clipboard Toggle word wrap

How to publish or expose the user-facing endpoints of your cluster, such as the Kubernetes API, OpenShift routes.

Value:`Internal` or`External`. The default value is`External`.

Setting this field to`Internal` is not supported on non-cloud platforms.

Important

If the value of the field is set to`Internal`, the cluster becomes non-functional. For more information, refer to [BZ#1953035](https://bugzilla.redhat.com/show_bug.cgi?id=1953035).

```plaintext
sshKey:
```

Copy to Clipboard Toggle word wrap

The SSH key to authenticate access to your cluster machines.

Note

For production OpenShift Container Platform clusters on which you want to perform installation debugging or disaster recovery, specify an SSH key that your`ssh-agent` process uses.

Value: For example,`sshKey: ssh-ed25519 AAAA..`.

| Table 9.3. Optional parameters | Parameter | Description |
| --- | --- | --- |

Show more

### 9.1.4. Additional bare metal configuration parameters for the Agent-based InstallerCopy link

Additional bare metal installation configuration parameters for the Agent-based Installer are described in the following table:

Note

These fields are not used during the initial provisioning of the cluster, but they are available to use once the cluster has been installed. Configuring these fields at install time eliminates the need to set them as a Day 2 operation.

Expand

```plaintext
platform:
 baremetal:
 clusterProvisioningIP:
```

Copy to Clipboard Toggle word wrap

The IP address within the cluster where the provisioning services run. Defaults to the third IP address of the provisioning subnet. For example,`172.22.0.3` or`2620:52:0:1307::3`.

Value: IPv4 or IPv6 address.

```plaintext
platform:
 baremetal:
 provisioningNetwork:
```

Copy to Clipboard Toggle word wrap

The`provisioningNetwork` configuration setting determines whether the cluster uses the provisioning network. If it does, the configuration setting also determines if the cluster manages the network.

`Managed`: Default. Set this parameter to`Managed` to fully manage the provisioning network, including DHCP, TFTP, and so on.

`Disabled`: Set this parameter to`Disabled` to disable the requirement for a provisioning network. When set to`Disabled`, you can use only virtual media based provisioning on Day 2. If`Disabled` and using power management, BMCs must be accessible from the bare-metal network. If Disabled, you must provide two IP addresses on the bare-metal network that are used for the provisioning services.

Value:`Managed` or`Disabled`.

```plaintext
platform:
 baremetal:
 provisioningMACAddress:
```

Copy to Clipboard Toggle word wrap

The MAC address within the cluster where provisioning services run.

Value: MAC address.

```plaintext
platform:
 baremetal:
 provisioningNetworkCIDR:
```

Copy to Clipboard Toggle word wrap

The CIDR for the network to use for provisioning. This option is required when not using the default address range on the provisioning network.

Value: Valid CIDR, for example`10.0.0.0/16`.

```plaintext
platform:
 baremetal:
 provisioningNetworkInterface:
```

Copy to Clipboard Toggle word wrap

The name of the network interface on nodes connected to the provisioning network. Use the`bootMACAddress` configuration setting to enable Ironic to identify the IP address of the NIC instead of using the`provisioningNetworkInterface` configuration setting to identify the name of the NIC.

Value: String.

```plaintext
platform:
 baremetal:
 provisioningDHCPRange:
```

Copy to Clipboard Toggle word wrap

Defines the IP range for nodes on the provisioning network, for example`172.22.0.10,172.22.0.254`.

Value: IP address range.

```plaintext
platform:
 baremetal:
 hosts:
```

Copy to Clipboard Toggle word wrap

Configuration for bare metal hosts.

Value: Array of host configuration objects.

```plaintext
platform:
 baremetal:
 hosts:
 name:
```

Copy to Clipboard Toggle word wrap

The name of the host.

Value: String.

```plaintext
platform:
 baremetal:
 hosts:
 bootMACAddress:
```

Copy to Clipboard Toggle word wrap

The MAC address of the NIC used for provisioning the host.

Value: MAC address.

```plaintext
platform:
 baremetal:
 hosts:
 bmc:
```

Copy to Clipboard Toggle word wrap

Configuration for the host to connect to the baseboard management controller (BMC).

Value: Dictionary of BMC configuration objects.

```plaintext
platform:
 baremetal:
 hosts:
 bmc:
 username:
```

Copy to Clipboard Toggle word wrap

The username for the BMC.

Value: String.

```plaintext
platform:
 baremetal:
 hosts:
 bmc:
 password:
```

Copy to Clipboard Toggle word wrap

Password for the BMC.

Value: String.

```plaintext
platform:
 baremetal:
 hosts:
 bmc:
 address:
```

Copy to Clipboard Toggle word wrap

The URL for communicating with the host’s BMC controller. The address configuration setting specifies the protocol. For example,`redfish+http://10.10.10.1:8000/redfish/v1/Systems/1234` enables Redfish. For more information, see "BMC addressing" in the "Deploying installer-provisioned clusters on bare metal" section.

Value: URL.

```plaintext
platform:
 baremetal:
 hosts:
 bmc:
 disableCertificateVerification:
```

Copy to Clipboard Toggle word wrap

`redfish` and`redfish-virtualmedia` need this parameter to manage BMC addresses. The value should be`True` when using a self-signed certificate for BMC addresses.

Value: Boolean.

| Table 9.4. Additional bare metal parameters | Parameter | Description |
| --- | --- | --- |

Show more

...[Content truncated]
