# Sphere seams over a nonradial strictly convex reference

Status: PROVED-INTERNAL derivation, submitted to the root for independent review. This extends the exact seam formula beyond references constant on the sphere. It is a local real Hessian calculation transferred through the frozen smooth full-test calibration and bounded BT continuity, not an arbitrary-background source theorem.

## 1. Assumptions and statement

Fix n≥2, 2≤q≤n, 0<α<1, and B=B_R centered at zero. Let v be C^{2,α} on a neighborhood of Bbar_{2R}, and let z∈C^{2,α}(Bbar), with z=0 on ∂B. Assume both D²v and D²(v+z) on their relevant closed regions are uniformly positive definite. Write

    b(ξ)=∂νz(ξ),       A_T(ξ)=D²v(ξ)|_{T_ξ∂B},

and assume b≤0. Let V=v+z inside B and V=v outside. The function is continuous and convex, since its bulk Hessians are positive and its gradient jump is −bν. Define

    J_v(b)(ξ)=∫_{b(ξ)}^0 σ_{q−1}(A_T(ξ)+(t/R)I_T)dt.     (NS1)

Then the real Hessian measure obtained as the limit of smooth convex convolutions of V has bulk density σ_q(D²V) off the sphere and sphere density J_v(b)dS. In particular it has the distribution/measure formula

    σ_q(D²V)_{measure}
      =1_B σ_q(D²v+D²z)dx
       +1_{outside B} σ_q(D²v)dx
       +J_v(b)dS_{∂B}.                                  (NS2)

The subscript in (NS2) denotes the approximated Hessian measure, not the undefined pointwise polynomial of a matrix-valued distribution. No singular matrices are multiplied.

The formula remains valid if v has nonconstant boundary values. Its proof below therefore deliberately does not use a bounded Newton-flux argument.

## 2. Boundary Hessian structure

Because z vanishes on the sphere, ∇z=bν there. Differentiating twice along a great circle gives D²z|_T=(b/R)I_T. Thus its two tangent Hessian limits at ξ are

    A_T(ξ)+(b(ξ)/R)I_T     on the inside,
    A_T(ξ)                on the outside.

Both are positive definite by the assumptions. Their affine interpolants are consequently positive definite. The function b belongs to C^{1,α} on the sphere, hence is Lipschitz.

Integration by parts across the interface gives the weak Hessian

    D²V=(D²v+1_B D²z)dx + (−b)ν⊗ν dS.                 (NS3)

This identity also proves convexity for b≤0. Conversely any convex gluing of the specified two C² pieces forces b≤0 by the normal one-dimensional slope condition.

## 3. Boundary-layer calculation with actual convolutions

Choose a nonnegative radial C∞ mollifier ρ supported in the unit ball, with integral one, and write ρ_ε(x)=ε^{−n}ρ(x/ε). Use V_ε=V*ρ_ε on a slightly smaller neighborhood of Bbar_R. These are actual smooth convex functions and converge locally uniformly to V.

In the thin layer, parametrize x=ξ+εsν(ξ), ξ∈∂B, |s|≤2. Use an orthonormal frame at ξ with its last vector ν(ξ). Radiality makes the following one-dimensional profiles independent of the chosen tangential frame:

    k(s)=∫_{R^{n−1}} ρ(y′,s)dy′,
    η(s)=∫_{y_n>s} ρ(y)dy.

They satisfy η′=−k, η=1 for s≤−1, and η=0 for s≥1. A point y=x−εa is in B if and only if a_n>s+O(ε) for bounded a. Therefore the fraction of its convolution kernel on the inside tends uniformly to η(s). Hölder continuity of the bulk Hessians, the smooth sphere geometry and the bounded compact support of ρ give the tangent block

    (D²V_ε)TT=A_T(ξ)+η(s)(b(ξ)/R)I_T+o(1),              (NS4)

uniformly in ξ,s. More precisely the bulk error is O(ε^α)+O(ε), and the singular surface contribution to TT is O(ε).

To see the latter estimates and the normal scale directly, parametrize nearby sphere points by tangent variables εu. Their normal is ν(ξ)+O(ε), with tangent component O(ε), and their surface element is ε^{n−1}(1+O(ε²))du. In convolution (NS3), the normal-normal surface contribution is

    (−b(ξ)) k(s)/ε + O(1),

uniformly. The O(1) follows from Lipschitz variation of b and smooth variation of the kernel argument under the quadratic sphere graph. Mixed surface entries are O(1); tangent surface entries are O(ε). Bounded bulk Hessians therefore yield

    (D²V_ε)nn=(−b(ξ))k(s)/ε+O(1),
    (D²V_ε)nT=O(1).                                    (NS5)

These are absolute estimates; they remain valid at points where b=0.

For a symmetric block matrix with tangent block A, mixed vector u and normal entry c, the elementary-symmetric expansion is

    σ_q([[A,u],[u^T,c]])
       =c σ_{q−1}(A)+σ_q(A)−u^T T_{q−2}(A)u.           (NS6)

Here σ_q(A)=0 if q exceeds its size, and T_0=I. Identity (NS6) follows by expanding each principal q-minor: those omitting the normal coordinate give σ_q(A), while those including it have determinant c det(A_I)−u_I^T cof(A_I)u_I. Summation gives the Newton tensor in the final term. In particular the remainder beyond c σ_{q−1}(A) is uniformly bounded when A,u are bounded.

Combining (NS4)--(NS6) gives the uniform layer limit

    ε σ_q(D²V_ε)(ξ+εsν)
      →(−b(ξ))k(s)σ_{q−1}(A_T(ξ)+η(s)b(ξ)I_T/R).       (NS7)

It also gives a uniform bound on the left-hand side. The uniform limit here uses α>0, bounded C² norms, and the Lipschitz boundary coefficient; there is no unproved control of products of singular measures.

## 4. Passage to measures and evaluation of the normal integral

Away from the sphere V_ε converges in C² on compact subsets of either side. Thus its density converges to the printed bulk density. In a tubular neighborhood the normal coordinates above have volume element

    dx=ε(1+εs/R)^{n−1}ds dS(ξ).

Use (NS7), its uniform bound, and continuity of an arbitrary compactly supported real test φ to pass to the limit in the layer integral. The limiting surface density is

    ∫_{−2}^2 (−b)k(s)σ_{q−1}(A_T+η(s)bI_T/R)ds.

For b<0, substitute η′=−k and then t=bη. Since η decreases from 1 to 0, this equals

    ∫_b^0 σ_{q−1}(A_T+tI_T/R)dt.

For b=0 both expressions are zero. This proves (NS1)--(NS2), including convergence against arbitrary continuous compact real tests. For completeness, one may first integrate over the fixed layer of thickness 2ε, where the preceding uniform bounds apply, and then over its complement; densities on the latter remain uniformly bounded because the convolution sees only a single C² piece. No mass is omitted in an intermediate shrinking region.

Since the tangent interpolants are uniformly positive definite, J_v(b)≥0 and J_v(b)=0 if and only if b=0. If their common lower eigenvalue bound is c_T>0, then

    J_v(b)≥binom(n−1,q−1)c_T^{q−1}(−b).

Likewise an upper eigenvalue bound gives the corresponding upper estimate. Thus zero seam is equivalent to matched normal derivatives within this specified piecewise-C² class.

## 5. Original non-Archimedean source formula

Let W be a known actual bounded admissible reference on the original torus box, equal to v(t) on the protected moment patch; assume it retains the neighborhood extension and actual-core qualifications used in the parent construction. Define U=W+ztilde(t), with ztilde zero outside B. The above real convexity makes U actual psh locally, and it glues to W outside B. A separately checked uniform budget preserves negativity, ordinary boundary values and lower-barrier bounds. Compact CLN and boundedness then supply finite mass/energy and unchanged deep truncations in the same way as before.

For S=β^{n−q}[X], the frozen smooth full-test calibration of each V_ε is

    μ_(V_ε)=K_q σ_*(σ_q(D²V_ε)dx),    K_q=q!(n−q)!.

For any original compact smooth scalar η, its pullback η∘σ is a continuous real test on the compact moment stage. The convergence just proved applies to it. Frozen bounded BT continuity under local uniform convergence passes the left-hand side to μ_U. A moment cutoff equal to one near Bbar gives the full source identity

    μ_U=μ_W+K_q σ_*{
      [σ_q(D²v+D²z)−σ_q(D²v)]1_B dx + J_v(b)dS} .        (NS8)

The exterior source remains unchanged. All original compact smooth scalar tests and their actual moment refinements are retained. The formula is not asserted for arbitrary positive backgrounds S or arbitrary GK delta tests.

## 6. A check exposing the limitation of the earlier flux proof

When v is constant on the sphere, the tangential gradient in the layer is O(ε), so the earlier bounded Newton-flux proof applies. If v has nonconstant boundary values, the tangential gradient can be O(1), while the tangent Newton-tensor block is O(ε^{−1}). The flux can then have a concentrated tangential part, and taking only the difference of its classical normal boundary values is invalid.

For an explicit check, add the affine function a·x to the quadratic reference p, and choose z=k(|x|²−R²)/2 inside B, with −1<k<0. This changes no Hessian, so the true seam density must be independent of a. The naive expression [F_out−F_in]·ν/q instead acquires the additional term

    C1(a·ν)/q [1−(1+k)^{q−1}],

which is generally nonzero. The missing concentrated tangential flux cancels it. The boundary-layer proof (NS3)--(NS7) correctly depends only on the Hessian tangent block and gives the affine-invariant density (NS1).

This is a check on the proof method, not a counterexample to (NS1). It explains why the new nonradial-base proof cannot simply repeat the constant-boundary flux argument.
