# Ti.Babel

Appcelerator CLI plugin for Babel, allowing you to use ES6 inside of your Titanium apps today.

# Installation

Run the following:

    git clone git@github.com:dawsontoth/ti.babel.git
    ti config -a paths.hooks ti.babel/hooks

Add the following to any Titanium apps you want to use ES6 in:

    <property name="ti.babel" type="bool">true</property>

That's it!

# Warning

Take care, I haven't tested this very much. Only use it on apps that you have backed up and under source control.
