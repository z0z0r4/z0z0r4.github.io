---
title: Nginx 和 Logrotate 的化学反应
sticky: false
mermaid: false
date: 2026-05-17 11:58:33
tags:
- DevOps
- Nginx
categories:
- DevOps
cover: /covers/nginx-502-bad-gateway.png
comments:
copyright:
sponsor:
---

TLDR: 更新后发现 Nginx 写入 `access.log.1` 导致 Logrotate 逻辑失效。

<!-- more -->

最近由于 Nginx CVE-2026-42945 ([NGINX Rift](https://depthfirst.com/research/nginx-rift-achieving-nginx-rce-via-an-18-year-old-vulnerability)) 的影响，需要更新 Nginx，然后触发了一个奇怪的 corner case，导致日志挤满硬盘，在此记录推测的原因。

前言：周四执行了 `apt update && apt install --only-upgrade nginx` 来更新 Nginx，更新完成后确认了 `nginx -v` 显示的版本号确实更新了，之后就没处理了。

表现在于每几十个小时之后就会因为 `/var/log/nginx` 目录占用过大而挤满硬盘，MongoDB Down 了。但第一次触发我没仔细看，发现 `/var/log/nginx/access.log.1` 和 `/var/log/nginx/error.log.1` 占了十多G，直接 `echo "" > /var/log/nginx/access.log.1` 和 `echo "" > /var/log/nginx/error.log.1` 就恢复了。

> 其实我此时就该发现的，为什么是 `*.log.1` 而不是 `*.log`

第二次是周日早上 8 点，一看报警 524，再看怎么又满了，先紧急清理了，一顿捣鼓（检查 `/etc/logrotate.d/nginx` 配置、检查 `crontab -l`）后注意到 `/var/log/nginx/access.log` 和 `/var/log/nginx/error.log` 都是 0 字节的空文件，而 `*.log.1` 却占了十多G，意识到可能是更新导致的。（但此时还怀疑过是新版本的轮转日志覆盖了我之前的日志，还是不够敏锐=-=）

遂试着 `systemctl restart nginx`，然后 `access.log` 和 `error.log` 终于开始正常记录了。

---

参考 Logrotate 的配置文件：

```
z0z0r4@z0z0r41:~$ cat /etc/logrotate.d/nginx
/var/log/nginx/*.log {
        daily
        missingok
        rotate 14
        compress
        delaycompress
        notifempty
        create 0640 www-data adm
        sharedscripts
        prerotate
                if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
                        run-parts /etc/logrotate.d/httpd-prerotate; \
                fi \
        endscript
        postrotate
                invoke-rc.d nginx rotate >/dev/null 2>&1
        endscript
}
```

肯定是 `postrotate` 失败了，但是到底是不是因为更新导致的失败，我试了下没法复现=-=

这是 Nginx 的包更新时的脚本：

```
z0z0r4@z0z0r41:~$ cat /var/lib/dpkg/info/nginx.prerm
#!/bin/sh
set -e

case "$1" in
  remove|remove-in-favour|deconfigure|deconfigure-in-favour)
    if [ -x /etc/init.d/nginx ]; then
      invoke-rc.d nginx stop || exit $?
    fi
    ;;

  upgrade|failed-upgrade)
    ;;

  *)
    echo "prerm called with unknown argument \`$1'" >&2
    exit 1
    ;;
esac



exit 0
z0z0r4@z0z0r41:~$ cat /var/lib/dpkg/info/nginx.postinst
#!/bin/sh
set -e

case "$1" in
  abort-upgrade|abort-remove|abort-deconfigure|configure)
    ;;
  triggered)
    if invoke-rc.d --quiet nginx status >/dev/null; then
      echo "Triggering nginx reload ..."
      invoke-rc.d nginx reload || true
    fi
    exit 0
    ;;
  *)
    echo "postinst called with unknown argument \`$1'" >&2
    exit 1
    ;;
esac

if invoke-rc.d --quiet nginx status >/dev/null; then
  invoke-rc.d nginx upgrade || invoke-rc.d nginx restart
  exit $?
else
  if ! invoke-rc.d nginx start; then
    echo "Failed to start NGINX in postinst script, please check the logs" >&2
    exit 0
  fi
fi



exit 0
```

里面更新后会调用 `invoke-rc.d nginx upgrade`。

这是 `/etc/init.d/nginx`：

```
z0z0r4@z0z0r41:~$ cat /etc/init.d/nginx
#!/bin/sh

### BEGIN INIT INFO
# Provides:       nginx
# Required-Start:    $local_fs $remote_fs $network $syslog $named
# Required-Stop:     $local_fs $remote_fs $network $syslog $named
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: starts the nginx web server
# Description:       starts nginx using start-stop-daemon
### END INIT INFO

PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
DAEMON=/usr/sbin/nginx
NAME=nginx
DESC=nginx

# Include nginx defaults if available
if [ -r /etc/default/nginx ]; then
        . /etc/default/nginx
fi

STOP_SCHEDULE="${STOP_SCHEDULE:-QUIT/5/TERM/5/KILL/5}"

test -x $DAEMON || exit 0

. /lib/init/vars.sh
. /lib/lsb/init-functions

# Try to extract nginx pidfile
PID=$(cat /etc/nginx/nginx.conf | grep -Ev '^\s*#' | awk 'BEGIN { RS="[;{}]" } { if ($1 == "pid") print $2 }' | head -n1)
if [ -z "$PID" ]; then
        PID=/run/nginx.pid
fi

if [ -n "$ULIMIT" ]; then
        # Set ulimit if it is set in /etc/default/nginx
        ulimit $ULIMIT
fi

start_nginx() {
        # Start the daemon/service
        #
        # Returns:
        #   0 if daemon has been started
        #   1 if daemon was already running
        #   2 if daemon could not be started
        start-stop-daemon --start --quiet --pidfile $PID --exec $DAEMON --test > /dev/null \
                || return 1
        start-stop-daemon --start --quiet --pidfile $PID --exec $DAEMON -- \
                $DAEMON_OPTS 2>/dev/null \
                || return 2
}

test_config() {
        # Test the nginx configuration
        $DAEMON -t $DAEMON_OPTS >/dev/null 2>&1
}

stop_nginx() {
        # Stops the daemon/service
        #
        # Return
        #   0 if daemon has been stopped
        #   1 if daemon was already stopped
        #   2 if daemon could not be stopped
        #   other if a failure occurred
        start-stop-daemon --stop --quiet --retry=$STOP_SCHEDULE --pidfile $PID --name $NAME
        RETVAL="$?"
        sleep 1
        return "$RETVAL"
}

reload_nginx() {
        # Function that sends a SIGHUP to the daemon/service
        start-stop-daemon --stop --signal HUP --quiet --pidfile $PID --name $NAME
        return 0
}

rotate_logs() {
        # Rotate log files
        start-stop-daemon --stop --signal USR1 --quiet --pidfile $PID --name $NAME
        return 0
}

upgrade_nginx() {
        # Online upgrade nginx executable
        # http://nginx.org/en/docs/control.html
        #
        # Return
        #   0 if nginx has been successfully upgraded
        #   1 if nginx is not running
        #   2 if the pid files were not created on time
        #   3 if the old master could not be killed
        if start-stop-daemon --stop --signal USR2 --quiet --pidfile $PID --name $NAME; then
                # Wait for both old and new master to write their pid file
                while [ ! -s "${PID}.oldbin" ] || [ ! -s "${PID}" ]; do
                        cnt=`expr $cnt + 1`
                        if [ $cnt -gt 10 ]; then
                                return 2
                        fi
                        sleep 1
                done
                # Everything is ready, gracefully stop the old master
                if start-stop-daemon --stop --signal QUIT --quiet --pidfile "${PID}.oldbin" --name $NAME; then
                        return 0
                else
                        return 3
                fi
        else
                return 1
        fi
}

case "$1" in
        start)
                log_daemon_msg "Starting $DESC" "$NAME"
                start_nginx
                case "$?" in
                        0|1) log_end_msg 0 ;;
                        2)   log_end_msg 1 ;;
                esac
                ;;
        stop)
                log_daemon_msg "Stopping $DESC" "$NAME"
                stop_nginx
                case "$?" in
                        0|1) log_end_msg 0 ;;
                        2)   log_end_msg 1 ;;
                esac
                ;;
        restart)
                log_daemon_msg "Restarting $DESC" "$NAME"

                # Check configuration before stopping nginx
                if ! test_config; then
                        log_end_msg 1 # Configuration error
                        exit $?
                fi

                stop_nginx
                case "$?" in
                        0|1)
                                start_nginx
                                case "$?" in
                                        0) log_end_msg 0 ;;
                                        1) log_end_msg 1 ;; # Old process is still running
                                        *) log_end_msg 1 ;; # Failed to start
                                esac
                                ;;
                        *)
                                # Failed to stop
                                log_end_msg 1
                                ;;
                esac
                ;;
        reload|force-reload)
                log_daemon_msg "Reloading $DESC configuration" "$NAME"

                # Check configuration before stopping nginx
                #
                # This is not entirely correct since the on-disk nginx binary
                # may differ from the in-memory one, but that's not common.
                # We prefer to check the configuration and return an error
                # to the administrator.
                if ! test_config; then
                        log_end_msg 1 # Configuration error
                        exit $?
                fi

                reload_nginx
                log_end_msg $?
                ;;
        configtest|testconfig)
                log_daemon_msg "Testing $DESC configuration"
                test_config
                log_end_msg $?
                ;;
        status)
                status_of_proc -p $PID "$DAEMON" "$NAME" && exit 0 || exit $?
                ;;
        upgrade)
                log_daemon_msg "Upgrading binary" "$NAME"
                upgrade_nginx
                log_end_msg $?
                ;;
        rotate)
                log_daemon_msg "Re-opening $DESC log files" "$NAME"
                rotate_logs
                log_end_msg $?
                ;;
        *)
                echo "Usage: $NAME {start|stop|restart|reload|force-reload|status|configtest|rotate|upgrade}" >&2
                exit 3
                ;;
esac
```

里面 `rotate` 函数是通过向 Nginx 发送 `USR1` 信号来让它重新打开日志文件的，但是都是静默发生，一直返回 0 的，如果失败了确实无法得知。

肯定是 `rotate` 失败了，但我没法复现出来，在此记录，下次遇到再跟踪下=-=。