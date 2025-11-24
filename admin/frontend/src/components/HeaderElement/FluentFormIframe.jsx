import React from "react";

export default function FluentFormIframe() {

    return (
        <iframe
            id="fluentform"
            src="https://lazycoders.co/?ff_landing=7&embedded=1&product_name=lazy_task&plugin_slug=lazytasks-premium"
            width="100%"
            height="410"
            style={{ border: 0, minHeight: 400 }}
            loading="lazy"
            title="Fluent Form"
        />
    );
}
